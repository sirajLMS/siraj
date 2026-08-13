import { getEnvironmentConfig } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import {
  type CachedToken,
  fetchWithTimeout,
  isRecord,
  isTokenExpired,
  MeetingAdapterBase,
} from "@/backend/services/meeting/channels/__shared__/meetingAdapterBase";
import {
  type GenerateMeetingInput,
  type GenerateMeetingResult,
  InsufficientScopesError,
  NoOrgCredentialsNoUserTokenError,
  ProviderUnavailableError,
  RateLimitedError,
  ZoomApiError,
} from "@/backend/services/meeting/channels/IMeetingChannel";
import type { ZoomErrorResponse, ZoomMeetingResponse, ZoomTokenResponse } from "@/backend/types";

export interface ZoomMeetingAdapterOptions {
  readonly accountId?: string;
  readonly clientId?: string;
  readonly clientSecret?: string;
}

const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token";
const ZOOM_API_BASE = "https://api.zoom.us/v2";
const TOKEN_REFRESH_MARGIN_MS = 60_000;

function base64Encode(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf-8").toString("base64");
  }
  return btoa(str);
}

function isZoomTokenResponse(value: unknown): value is ZoomTokenResponse {
  if (!isRecord(value)) return false;
  return (
    typeof value.access_token === "string" &&
    typeof value.token_type === "string" &&
    typeof value.expires_in === "number" &&
    typeof value.scope === "string"
  );
}

function isZoomMeetingResponse(value: unknown): value is ZoomMeetingResponse {
  if (!isRecord(value)) return false;
  return typeof value.id === "number" && typeof value.topic === "string" && typeof value.join_url === "string";
}

function isZoomErrorResponse(value: unknown): value is ZoomErrorResponse {
  if (!isRecord(value)) return false;
  return typeof value.code === "number" && typeof value.message === "string";
}

const ZOOM_REQUIRED_SCOPES = ["meeting:write:meeting", "user:read:user"] as const;

export class ZoomMeetingAdapter extends MeetingAdapterBase {
  static readonly ENDPOINTS: readonly string[] = [
    "https://zoom.us/oauth/token",
    "https://api.zoom.us/v2/users/me",
    "https://api.zoom.us/v2/meetings",
  ];
  protected readonly providerSlug = "zoom" as const;
  protected readonly tokenRefreshMarginMs = TOKEN_REFRESH_MARGIN_MS;

  private readonly accountId?: string;
  private readonly clientId?: string;
  private readonly clientSecret?: string;

  constructor(opts?: ZoomMeetingAdapterOptions) {
    super();
    const envConfig =
      opts?.accountId !== undefined && opts?.clientId !== undefined && opts?.clientSecret !== undefined
        ? null
        : getEnvironmentConfig();
    this.accountId = opts?.accountId ?? envConfig?.zoomAccountId;
    this.clientId = opts?.clientId ?? envConfig?.zoomClientId;
    this.clientSecret = opts?.clientSecret ?? envConfig?.zoomClientSecret;

    // Scope validation happens at token-mint time (see mintToken) where the
    // actual granted scopes are returned by Zoom's OAuth endpoint.  A
    // construction-time check against envConfig would be dead code in the
    // factory/DI path (envConfig is null there), so we intentionally omit it.
  }

  async validateConfig(): Promise<boolean> {
    if (!this.accountId || !this.clientId || !this.clientSecret) {
      logger.warn("ZoomMeetingAdapter: missing org credentials");
      return false;
    }
    return true;
  }

  protected async resolveAccessToken(input: GenerateMeetingInput): Promise<string> {
    const hasOrgCreds = !!(this.accountId && this.clientId && this.clientSecret);

    if (hasOrgCreds) {
      return this.mintToken();
    }
    if (input.actorUserId) {
      return this.getPerUserAccessToken(input.actorUserId);
    }
    throw new NoOrgCredentialsNoUserTokenError("zoom");
  }

  protected async callProviderApi(accessToken: string, input: GenerateMeetingInput): Promise<GenerateMeetingResult> {
    const meetingBody: Record<string, unknown> = {
      topic: input.topic,
      type: 2,
      timezone: "UTC",
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        waiting_room: true,
        mute_upon_entry: true,
      },
    };

    if (input.startDateTime) {
      meetingBody.start_time = input.startDateTime;
    }
    if (input.durationMinutes) {
      meetingBody.duration = input.durationMinutes;
    }

    const response = await fetchWithTimeout(
      `${ZOOM_API_BASE}/users/me/meetings`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(meetingBody),
      },
      this.providerSlug
    );

    await this.assertResponseOk(response, "Zoom meeting creation failed");

    const meeting: unknown = await response.json();
    if (!isZoomMeetingResponse(meeting)) {
      throw new ZoomApiError("Zoom meeting response was malformed", undefined, response.status);
    }
    return {
      joinUrl: meeting.join_url,
      meetingId: String(meeting.id),
      password: meeting.password,
      hostUrl: meeting.start_url,
      providerMetadata: {
        zoomMeetingId: meeting.id,
        zoomUuid: meeting.uuid,
      },
    };
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    let accessToken: string;
    const hasOrgCreds = !!(this.accountId && this.clientId && this.clientSecret);

    if (hasOrgCreds) {
      accessToken = await this.mintToken();
    } else {
      throw new NoOrgCredentialsNoUserTokenError("zoom");
    }

    try {
      const response = await fetchWithTimeout(
        `${ZOOM_API_BASE}/meetings/${meetingId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
        this.providerSlug
      );
      if (!response.ok && response.status !== 204) {
        const errorBody = await this.parseErrorBody(response);
        logger.warn("ZoomMeetingAdapter: deleteMeeting failed", {
          status: response.status,
          message: errorBody?.message,
        });
      }
    } catch (error) {
      logger.warn("ZoomMeetingAdapter: deleteMeeting network error", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async disconnect(token?: { accessToken: string; refreshToken: string | null }): Promise<void> {
    if (token) {
      try {
        const body = new URLSearchParams({ token: token.accessToken });
        await fetch("https://zoom.us/oauth/revoke", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        });
      } catch (error) {
        logger.warn("ZoomMeetingAdapter: token revocation failed", {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
    this.clearCachedToken();
  }

  private async mintToken(): Promise<string> {
    if (this.cachedToken && !isTokenExpired(this.cachedToken, this.tokenRefreshMarginMs)) {
      return this.cachedToken.accessToken;
    }

    if (!this.accountId || !this.clientId || !this.clientSecret) {
      throw new NoOrgCredentialsNoUserTokenError("zoom");
    }

    const credentials = base64Encode(`${this.clientId}:${this.clientSecret}`);
    const body = new URLSearchParams({
      grant_type: "account_credentials",
      account_id: this.accountId,
    });

    const response = await fetchWithTimeout(
      ZOOM_TOKEN_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      },
      this.providerSlug
    );

    await this.assertResponseOk(response, "Zoom token request failed");

    const tokenData: unknown = await response.json();
    if (!isZoomTokenResponse(tokenData)) {
      throw new ZoomApiError("Zoom token response was malformed", undefined, response.status);
    }

    const grantedScopes = tokenData.scope.split(" ");
    const missingScopes = ZOOM_REQUIRED_SCOPES.filter(scope => !grantedScopes.includes(scope));
    if (missingScopes.length > 0) {
      throw new InsufficientScopesError(
        [...ZOOM_REQUIRED_SCOPES],
        grantedScopes,
        `Missing scopes: ${missingScopes.join(", ")}`
      );
    }

    this.cachedToken = {
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
    } satisfies CachedToken;
    return tokenData.access_token;
  }

  private async assertResponseOk(response: Response, failureMessage: string): Promise<void> {
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      throw new RateLimitedError(this.providerSlug, retryAfter ? Number.parseInt(retryAfter, 10) : undefined);
    }

    if (!response.ok) {
      const errorBody = await this.parseErrorBody(response);
      if (response.status >= 500) {
        throw new ProviderUnavailableError(this.providerSlug, response.status, errorBody?.message);
      }
      throw new ZoomApiError(
        errorBody?.message ?? `${failureMessage} (${response.status})`,
        errorBody?.code,
        response.status
      );
    }
  }

  private async parseErrorBody(response: Response): Promise<ZoomErrorResponse | null> {
    try {
      const body: unknown = await response.json();
      return isZoomErrorResponse(body) ? body : null;
    } catch {
      return null;
    }
  }
}
