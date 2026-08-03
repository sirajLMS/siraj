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
  NoOrgCredentialsNoUserTokenError,
  ProviderUnavailableError,
  RateLimitedError,
  ZoomApiError,
} from "@/backend/services/meeting/channels/IMeetingChannel";
import type {
  ZoomErrorResponse,
  ZoomMeetingResponse,
  ZoomTokenResponse,
} from "@/backend/services/meeting/channels/zoom/zoom.types";
import { refreshAccessToken } from "@/backend/services/meeting/integrations/token-refresh";

export interface ZoomMeetingAdapterOptions {
  readonly accountId?: string;
  readonly clientId?: string;
  readonly clientSecret?: string;
}

const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token";
const ZOOM_API_BASE = "https://api.zoom.us/v2";
const REQUEST_TIMEOUT_MS = 30_000;
const TOKEN_REFRESH_MARGIN_MS = 60_000;

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

function base64Encode(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf-8").toString("base64");
  }
  return btoa(str);
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

const ZOOM_REQUIRED_SCOPES = ["meeting:write:meeting", "user:read:user"] as const;

export class ZoomMeetingAdapter implements IMeetingChannel {
  static readonly ENDPOINTS: readonly string[] = [
    "https://zoom.us/oauth/token",
    "https://api.zoom.us/v2/users/me",
    "https://api.zoom.us/v2/meetings",
  ];
  private readonly accountId?: string;
  private readonly clientId?: string;
  private readonly clientSecret?: string;
  private cachedToken: CachedToken | null = null;

  constructor(opts?: ZoomMeetingAdapterOptions) {
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

  async generateMeeting(input: GenerateMeetingInput): Promise<GenerateMeetingResult> {
    const hasOrgCreds = !!(this.accountId && this.clientId && this.clientSecret);

    let accessToken: string;

    if (hasOrgCreds) {
      accessToken = await this.mintToken();
    } else if (input.actorUserId) {
      accessToken = await this.getPerUserAccessToken(input.actorUserId);
    } else {
      throw new NoOrgCredentialsNoUserTokenError("zoom");
    }

    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, jitterDelay(200)));
      }
      try {
        return await this.createMeeting(accessToken, input);
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
    let accessToken: string;
    const hasOrgCreds = !!(this.accountId && this.clientId && this.clientSecret);

    if (hasOrgCreds) {
      accessToken = await this.mintToken();
    } else {
      throw new NoOrgCredentialsNoUserTokenError("zoom");
    }

    const { signal, cancel } = withTimeout(REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${ZOOM_API_BASE}/meetings/${meetingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal,
      });
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
    } finally {
      cancel();
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
    this.cachedToken = null;
  }

  private async mintToken(): Promise<string> {
    if (this.cachedToken && !isExpired(this.cachedToken)) {
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

    const { signal, cancel } = withTimeout(REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(ZOOM_TOKEN_URL, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
        signal,
      });
    } catch (error) {
      cancel();
      throw new ProviderUnavailableError("zoom", undefined, error instanceof Error ? error.message : String(error));
    }
    cancel();

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      throw new RateLimitedError("zoom", retryAfter ? parseInt(retryAfter, 10) : undefined);
    }

    if (!response.ok) {
      const errorBody = await this.parseErrorBody(response);
      throw new ZoomApiError(
        errorBody?.message ?? `Zoom token request failed (${response.status})`,
        errorBody?.code,
        response.status
      );
    }

    const tokenData = (await response.json()) as ZoomTokenResponse;

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
    };
    return tokenData.access_token;
  }

  private async getPerUserAccessToken(actorUserId: string): Promise<string> {
    const tokenRow = await MeetingProviderTokenRepository.getByUserAndProvider(actorUserId, "zoom");
    if (!tokenRow?.refreshToken) {
      throw new NoOrgCredentialsNoUserTokenError("zoom");
    }

    logger.debug("ZoomMeetingAdapter: using per-user token fallback", { actorUserId });

    // Return the stored access token if it is still valid (within the refresh
    // margin) to avoid racing concurrent calls on the single-use refresh token.
    const storedExpiry = tokenRow.expiresAt ? tokenRow.expiresAt.getTime() : 0;
    if (tokenRow.accessToken && Date.now() < storedExpiry - TOKEN_REFRESH_MARGIN_MS) {
      return tokenRow.accessToken;
    }

    const refreshed = await refreshAccessToken("zoom", tokenRow.refreshToken, actorUserId);

    // Persist the refreshed tokens for subsequent calls.
    await MeetingProviderTokenRepository.upsert({
      userId: actorUserId,
      providerSlug: "zoom",
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken ?? tokenRow.refreshToken,
      expiresAt: refreshed.expiresAt,
      scopes: tokenRow.scopes,
    });

    return refreshed.accessToken;
  }

  private async createMeeting(accessToken: string, input: GenerateMeetingInput): Promise<GenerateMeetingResult> {
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

    const { signal, cancel } = withTimeout(REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(`${ZOOM_API_BASE}/users/me/meetings`, {
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
      throw new ProviderUnavailableError("zoom", undefined, error instanceof Error ? error.message : String(error));
    }
    cancel();

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      throw new RateLimitedError("zoom", retryAfter ? parseInt(retryAfter, 10) : undefined);
    }

    if (response.status >= 500) {
      const errorBody = await this.parseErrorBody(response);
      throw new ProviderUnavailableError("zoom", response.status, errorBody?.message);
    }

    if (!response.ok) {
      const errorBody = await this.parseErrorBody(response);
      throw new ZoomApiError(
        errorBody?.message ?? `Zoom meeting creation failed (${response.status})`,
        errorBody?.code,
        response.status
      );
    }

    const meeting = (await response.json()) as ZoomMeetingResponse;
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

  private async parseErrorBody(response: Response): Promise<ZoomErrorResponse | null> {
    try {
      return (await response.json()) as ZoomErrorResponse;
    } catch {
      return null;
    }
  }
}
