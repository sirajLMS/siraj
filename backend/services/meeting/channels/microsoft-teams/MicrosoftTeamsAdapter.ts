import { MeetingProviderTokenRepository } from "@/backend/db/repo/meeting/meeting-provider-token.repository";
import { getEnvironmentConfig } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import type {
  GenerateMeetingInput,
  GenerateMeetingResult,
  IMeetingChannel,
} from "@/backend/services/meeting/channels/IMeetingChannel";
import {
  InsufficientScopesError,
  MicrosoftTeamsApiError,
  NoAppAccessPolicyError,
  NoOrgCredentialsNoUserTokenError,
  ProviderUnavailableError,
  RateLimitedError,
} from "@/backend/services/meeting/channels/IMeetingChannel";
import type {
  MicrosoftTeamsErrorResponse,
  MicrosoftTeamsMeetingResponse,
  MicrosoftTeamsTokenResponse,
} from "@/backend/services/meeting/channels/microsoft-teams/microsoft-teams.types";
import { refreshAccessToken } from "@/backend/services/meeting/integrations/token-refresh";

export interface MicrosoftTeamsAdapterOptions {
  readonly tenantId?: string;
  readonly clientId?: string;
  readonly clientSecret?: string;
  readonly organizerUserId?: string;
}

const MS_TOKEN_URL_TEMPLATE = "https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token";
const MS_GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const REQUEST_TIMEOUT_MS = 30_000;
const TOKEN_REFRESH_MARGIN_MS = 120_000;

const MS_TEAMS_REQUIRED_SCOPES = ["OnlineMeetings.ReadWrite.All"] as const;

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

function withTimeout(ms: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

function jitterDelay(baseMs: number): number {
  return baseMs + (Date.now() % 100);
}

function isExpired(token: CachedToken | null): boolean {
  if (!token) return true;
  return Date.now() >= token.expiresAt - TOKEN_REFRESH_MARGIN_MS;
}

export class MicrosoftTeamsAdapter implements IMeetingChannel {
  static readonly ENDPOINTS: readonly string[] = [
    "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
    "https://graph.microsoft.com/v1.0/users/{organizer}/onlineMeetings",
    "https://graph.microsoft.com/.default",
  ];
  private readonly tenantId?: string;
  private readonly clientId?: string;
  private readonly clientSecret?: string;
  private readonly organizerUserId?: string;
  private cachedToken: CachedToken | null = null;

  constructor(opts?: MicrosoftTeamsAdapterOptions) {
    const envConfig = opts?.tenantId !== undefined ? null : getEnvironmentConfig();
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

  async generateMeeting(input: GenerateMeetingInput): Promise<GenerateMeetingResult> {
    const hasOrgCreds = !!(this.tenantId && this.clientId && this.clientSecret && this.organizerUserId);

    let accessToken: string;
    let organizerUserId: string;

    if (hasOrgCreds) {
      accessToken = await this.getAccessToken();
      organizerUserId = this.organizerUserId ?? "";
    } else if (input.actorUserId) {
      accessToken = await this.getPerUserAccessToken(input.actorUserId);
      // For per-user delegates tokens, use "me" — Graph API resolves the
      // token holder's identity from the access token.
      organizerUserId = "me";
    } else {
      throw new NoOrgCredentialsNoUserTokenError("microsoft_teams");
    }

    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, jitterDelay(200)));
      }
      try {
        return await this.createOnlineMeeting(accessToken, organizerUserId, input);
      } catch (error) {
        lastError = error;
        if (error instanceof ProviderUnavailableError) {
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    if (!this.organizerUserId) {
      throw new NoOrgCredentialsNoUserTokenError("microsoft_teams");
    }
    const accessToken = await this.getAccessToken();
    const url = `${MS_GRAPH_BASE}/users/${this.organizerUserId}/onlineMeetings/${meetingId}`;

    const { signal, cancel } = withTimeout(REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
        signal,
      });
      if (!response.ok && response.status !== 204) {
        const errorBody = await this.parseErrorBody(response);
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
      if (!this.tenantId) {
        logger.warn("MicrosoftTeamsAdapter: cannot revoke token — tenantId not configured");
      } else {
        try {
          const body = new URLSearchParams({ token: token.accessToken });
          await fetch(`https://login.microsoftonline.com/${encodeURIComponent(this.tenantId)}/oauth2/v2.0/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString(),
          });
        } catch (error) {
          logger.warn("MicrosoftTeamsAdapter: token revocation failed", {
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
    this.cachedToken = null;
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && !isExpired(this.cachedToken)) {
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
      const errorBody = await this.parseErrorBody(response);
      throw new MicrosoftTeamsApiError(
        errorBody?.error?.message ?? `Microsoft token request failed (${response.status})`,
        errorBody?.error?.code,
        response.status
      );
    }

    const tokenData = (await response.json()) as MicrosoftTeamsTokenResponse;

    if (tokenData.scope) {
      const grantedScopes = tokenData.scope.split(" ");
      const normalizeScope = (scope: string): string =>
        scope.startsWith("https://graph.microsoft.com/") ? scope.slice("https://graph.microsoft.com/".length) : scope;
      const normalizedGranted = grantedScopes.map(normalizeScope);
      const normalizedRequired = MS_TEAMS_REQUIRED_SCOPES.map(normalizeScope);
      const missingScopes = normalizedRequired.filter(scope => !normalizedGranted.includes(scope));
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
    };
    return tokenData.access_token;
  }

  private async getPerUserAccessToken(actorUserId: string): Promise<string> {
    const tokenRow = await MeetingProviderTokenRepository.getByUserAndProvider(actorUserId, "microsoft_teams");
    if (!tokenRow?.refreshToken) {
      throw new NoOrgCredentialsNoUserTokenError("microsoft_teams");
    }

    logger.debug("MicrosoftTeamsAdapter: using per-user token fallback", { actorUserId });

    // Return the stored access token if it is still valid (within the refresh
    // margin) to avoid racing concurrent calls on the single-use refresh token.
    const storedExpiry = tokenRow.expiresAt ? tokenRow.expiresAt.getTime() : 0;
    if (tokenRow.accessToken && Date.now() < storedExpiry - TOKEN_REFRESH_MARGIN_MS) {
      return tokenRow.accessToken;
    }

    const refreshed = await refreshAccessToken("microsoft_teams", tokenRow.refreshToken, actorUserId);

    await MeetingProviderTokenRepository.upsert({
      userId: actorUserId,
      providerSlug: "microsoft_teams",
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken ?? tokenRow.refreshToken,
      expiresAt: refreshed.expiresAt,
      scopes: tokenRow.scopes,
    });

    return refreshed.accessToken;
  }

  private async createOnlineMeeting(
    accessToken: string,
    organizerUserId: string,
    input: GenerateMeetingInput
  ): Promise<GenerateMeetingResult> {
    const now = new Date();
    const startISO = input.startDateTime ?? now.toISOString();
    const durationMinutes = input.durationMinutes ?? 60;
    const endISO = input.startDateTime
      ? new Date(new Date(input.startDateTime).getTime() + durationMinutes * 60_000).toISOString()
      : new Date(now.getTime() + durationMinutes * 60_000).toISOString();

    const meetingBody = {
      subject: input.topic,
      startDateTime: startISO,
      endDateTime: endISO,
    };

    const url =
      organizerUserId === "me"
        ? `${MS_GRAPH_BASE}/me/onlineMeetings`
        : `${MS_GRAPH_BASE}/users/${organizerUserId}/onlineMeetings`;
    const { signal, cancel } = withTimeout(REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(meetingBody),
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

    if (response.status === 403) {
      const errorBody = await this.parseErrorBody(response);
      const message = errorBody?.error?.message ?? "";
      const errorCode = errorBody?.error?.code;
      if (errorCode === "ApplicationAccessPolicy" || message.includes("No application access policy")) {
        throw new NoAppAccessPolicyError(message);
      }
      throw new MicrosoftTeamsApiError(
        message || `Teams meeting creation forbidden (${response.status})`,
        errorBody?.error?.code,
        response.status
      );
    }

    if (response.status >= 500) {
      const errorBody = await this.parseErrorBody(response);
      throw new ProviderUnavailableError("microsoft_teams", response.status, errorBody?.error?.message);
    }

    if (!response.ok) {
      const errorBody = await this.parseErrorBody(response);
      throw new MicrosoftTeamsApiError(
        errorBody?.error?.message ?? `Teams meeting creation failed (${response.status})`,
        errorBody?.error?.code,
        response.status
      );
    }

    const meeting = (await response.json()) as MicrosoftTeamsMeetingResponse;
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

  private async parseErrorBody(response: Response): Promise<MicrosoftTeamsErrorResponse | null> {
    try {
      return (await response.json()) as MicrosoftTeamsErrorResponse;
    } catch {
      return null;
    }
  }
}
