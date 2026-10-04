import { getEnvironmentConfig } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import {
  fetchWithTimeout,
  isTokenExpired,
  MeetingAdapterBase,
  REQUEST_TIMEOUT_MS,
  withTimeout,
} from "@/backend/services/meeting/channels/__shared__/meetingAdapterBase";
import {
  InsufficientScopesError,
  MicrosoftTeamsApiError,
  NoOrgCredentialsNoUserTokenError,
  ProviderUnavailableError,
  RateLimitedError,
} from "@/backend/services/meeting/channels/IMeetingChannel";
import {
  assertMicrosoftTeamsMeetingResponseOk,
  isMicrosoftTeamsMeetingResponse,
  isMicrosoftTeamsTokenResponse,
  MS_GRAPH_BASE,
  MS_TEAMS_REQUIRED_SCOPES,
  MS_TOKEN_URL_TEMPLATE,
  normalizeScope,
  parseMicrosoftTeamsErrorBody,
  postMicrosoftTeamsMeetingRequest,
  TOKEN_REFRESH_MARGIN_MS,
} from "@/backend/services/meeting/channels/microsoft-teams/MicrosoftTeamsAdapter.helpers";
import type {
  CachedToken,
  GenerateMeetingInput,
  GenerateMeetingResult,
  MicrosoftTeamsMeetingResponse,
} from "@/backend/types";

export interface MicrosoftTeamsAdapterOptions {
  readonly tenantId?: string;
  readonly clientId?: string;
  readonly clientSecret?: string;
  readonly organizerUserId?: string;
}

export class MicrosoftTeamsAdapter extends MeetingAdapterBase {
  static readonly ENDPOINTS: readonly string[] = [
    "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
    "https://graph.microsoft.com/v1.0/users/{organizer}/onlineMeetings",
    "https://graph.microsoft.com/.default",
  ];
  protected readonly providerSlug = "microsoft_teams" as const;
  protected readonly tokenRefreshMarginMs = TOKEN_REFRESH_MARGIN_MS;

  private readonly tenantId?: string;
  private readonly clientId?: string;
  private readonly clientSecret?: string;
  private readonly organizerUserId?: string;

  constructor(opts?: MicrosoftTeamsAdapterOptions) {
    super();
    const envConfig = opts?.tenantId != null ? null : getEnvironmentConfig();
    this.tenantId = opts?.tenantId ?? envConfig?.msTeamsTenantId;
    this.clientId = opts?.clientId ?? envConfig?.msTeamsClientId;
    this.clientSecret = opts?.clientSecret ?? envConfig?.msTeamsClientSecret;
    this.organizerUserId = opts?.organizerUserId ?? envConfig?.msTeamsOrganizerUserId;

    // Scope validation happens at token-acquisition time (see getAccessToken)
    // where the actual granted scopes are returned by Microsoft's OAuth
    // endpoint.  A construction-time check against envConfig would be dead
    // code in the factory/DI path (envConfig is null there).
  }

  async validateConfig(): Promise<boolean> {
    if (!this.tenantId || !this.clientId || !this.clientSecret || !this.organizerUserId) {
      logger.warn("MicrosoftTeamsAdapter: missing org credentials");
      return false;
    }
    return true;
  }

  protected async resolveAccessToken(input: GenerateMeetingInput): Promise<string> {
    const hasOrgCreds = !!(this.tenantId && this.clientId && this.clientSecret && this.organizerUserId);

    if (hasOrgCreds) {
      return this.getAccessToken();
    }
    if (input.actorUserId) {
      return this.getPerUserAccessToken(input.actorUserId);
    }
    throw new NoOrgCredentialsNoUserTokenError("microsoft_teams");
  }

  protected async callProviderApi(accessToken: string, input: GenerateMeetingInput): Promise<GenerateMeetingResult> {
    // For per-user delegates, use "me" — Graph API resolves the token holder's
    // identity from the access token. For org credentials, use the configured organizer.
    const hasOrgCreds = !!(this.tenantId && this.organizerUserId);
    const organizerUserId = hasOrgCreds ? (this.organizerUserId ?? "") : "me";

    const meetingBody = this.buildMeetingRequestBody(input);
    const url = this.buildMeetingUrl(organizerUserId);
    const response = await postMicrosoftTeamsMeetingRequest(url, accessToken, meetingBody);
    await assertMicrosoftTeamsMeetingResponseOk(response);
    const rawMeeting: unknown = await response.json();
    if (!isMicrosoftTeamsMeetingResponse(rawMeeting)) {
      throw new MicrosoftTeamsApiError(
        `Teams meeting response was malformed (${response.status})`,
        undefined,
        response.status
      );
    }
    return this.mapMeetingResponse(rawMeeting);
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    if (!this.organizerUserId) {
      throw new NoOrgCredentialsNoUserTokenError("microsoft_teams");
    }
    const accessToken = await this.getAccessToken();
    const url = `${MS_GRAPH_BASE}/users/${this.organizerUserId}/onlineMeetings/${encodeURIComponent(meetingId)}`;

    const { signal, cancel } = withTimeout(REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
        signal,
      });
      if (!response.ok && response.status !== 204) {
        const errorBody = await parseMicrosoftTeamsErrorBody(response);
        logger.warn("MicrosoftTeamsAdapter: deleteMeeting failed", {
          status: response.status,
          message: errorBody?.error?.message,
        });
      }
    } catch (error) {
      logger.warn("MicrosoftTeamsAdapter: deleteMeeting network error", {
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      cancel();
    }
  }

  async disconnect(token?: { accessToken: string; refreshToken: string | null }): Promise<void> {
    if (token) {
      if (this.tenantId == null) {
        logger.warn("MicrosoftTeamsAdapter: cannot revoke token — tenantId not configured");
      } else {
        try {
          const body = new URLSearchParams({ token: token.accessToken });
          await fetchWithTimeout(
            `https://login.microsoftonline.com/${encodeURIComponent(this.tenantId)}/oauth2/v2.0/logout`,
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: body.toString(),
            },
            this.providerSlug
          );
        } catch (error) {
          logger.warn("MicrosoftTeamsAdapter: token revocation failed", {
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
    this.clearCachedToken();
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && !isTokenExpired(this.cachedToken, this.tokenRefreshMarginMs)) {
      return this.cachedToken.accessToken;
    }

    if (!this.tenantId || !this.clientId || !this.clientSecret) {
      throw new NoOrgCredentialsNoUserTokenError("microsoft_teams");
    }

    const tokenUrl = MS_TOKEN_URL_TEMPLATE.replace("{tenantId}", this.tenantId);
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    });

    const { signal, cancel } = withTimeout(REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        signal,
      });
    } catch (error) {
      cancel();
      throw new ProviderUnavailableError(
        "microsoft_teams",
        undefined,
        error instanceof Error ? error.message : String(error)
      );
    }
    cancel();

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      throw new RateLimitedError("microsoft_teams", retryAfter ? Number.parseInt(retryAfter, 10) : undefined);
    }

    if (!response.ok) {
      const errorBody = await parseMicrosoftTeamsErrorBody(response);
      throw new MicrosoftTeamsApiError(
        errorBody?.error?.message ?? `Microsoft token request failed (${response.status})`,
        errorBody?.error?.code,
        response.status
      );
    }

    const rawToken: unknown = await response.json();
    if (!isMicrosoftTeamsTokenResponse(rawToken)) {
      throw new MicrosoftTeamsApiError(
        `Microsoft token response was malformed (${response.status})`,
        undefined,
        response.status
      );
    }
    const tokenData = rawToken;

    if (tokenData.scope) {
      const grantedScopes = tokenData.scope.split(" ");
      const normalizedGranted = new Set(grantedScopes.map(normalizeScope));
      const normalizedRequired = MS_TEAMS_REQUIRED_SCOPES.map(normalizeScope);
      const missingScopes = normalizedRequired.filter(scope => !normalizedGranted.has(scope));
      if (missingScopes.length > 0) {
        throw new InsufficientScopesError(
          [...MS_TEAMS_REQUIRED_SCOPES],
          grantedScopes,
          `Missing scopes: ${missingScopes.join(", ")}`
        );
      }
    }

    this.cachedToken = {
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
    } satisfies CachedToken;
    return tokenData.access_token;
  }

  private buildMeetingRequestBody(input: GenerateMeetingInput): {
    subject: string;
    startDateTime: string;
    endDateTime: string;
  } {
    const now = new Date();
    const startISO = input.startDateTime ?? now.toISOString();
    const durationMinutes = input.durationMinutes ?? 60;
    const endISO = input.startDateTime
      ? new Date(new Date(input.startDateTime).getTime() + durationMinutes * 60_000).toISOString()
      : new Date(now.getTime() + durationMinutes * 60_000).toISOString();

    return {
      subject: input.topic,
      startDateTime: startISO,
      endDateTime: endISO,
    };
  }

  private buildMeetingUrl(organizerUserId: string): string {
    return organizerUserId === "me"
      ? `${MS_GRAPH_BASE}/me/onlineMeetings`
      : `${MS_GRAPH_BASE}/users/${organizerUserId}/onlineMeetings`;
  }

  private mapMeetingResponse(meeting: MicrosoftTeamsMeetingResponse): GenerateMeetingResult {
    return {
      joinUrl: meeting.joinWebUrl,
      meetingId: meeting.id,
      password: meeting.joinMeetingIdSettings?.passcode,
      providerMetadata: {
        onlineMeetingId: meeting.id,
        joinMeetingId: meeting.joinMeetingIdSettings?.joinMeetingId,
        subject: meeting.subject,
      },
    };
  }
}
