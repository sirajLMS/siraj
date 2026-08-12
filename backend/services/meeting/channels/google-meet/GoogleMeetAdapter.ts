import { SignJWT } from "jose";
import { getEnvironmentConfig } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import {
  type CachedToken,
  isRecord,
  isTokenExpired,
  MeetingAdapterBase,
  REQUEST_TIMEOUT_MS,
  withTimeout,
} from "@/backend/services/meeting/channels/__shared__/meetingAdapterBase";
import type {
  GoogleMeetErrorResponse,
  GoogleMeetServiceAccountJson,
  GoogleMeetSpaceResponse,
  GoogleMeetTokenResponse,
} from "@/backend/services/meeting/channels/google-meet/google-meet.types";
import type { GenerateMeetingInput, GenerateMeetingResult } from "@/backend/services/meeting/channels/IMeetingChannel";
import {
  GoogleMeetApiError,
  InvalidServiceAccountJsonError,
  MeetingChannelError,
  MissingImpersonationSubjectError,
  NoOrgCredentialsNoUserTokenError,
  PermissionDeniedError,
  ProviderUnavailableError,
  RateLimitedError,
} from "@/backend/services/meeting/channels/IMeetingChannel";

export interface GoogleMeetAdapterOptions {
  readonly serviceAccountJson?: string;
  readonly impersonateSubject?: string;
  readonly defaultAccessType?: number;
}

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_MEET_SPACES_URL = "https://meet.googleapis.com/v2/spaces";
const TOKEN_REFRESH_MARGIN_MS = 60_000;
const SCOPE = "https://www.googleapis.com/auth/meetings.space.created";

interface ParsedServiceAccount {
  readonly clientEmail: string;
  readonly privateKey: string;
  readonly privateKeyId: string;
}

function isServiceAccountJson(value: unknown): value is GoogleMeetServiceAccountJson {
  if (!isRecord(value)) return false;
  return (
    typeof value.type === "string" && typeof value.client_email === "string" && typeof value.private_key === "string"
  );
}

function isTokenResponse(value: unknown): value is GoogleMeetTokenResponse {
  if (!isRecord(value)) return false;
  return (
    typeof value.access_token === "string" &&
    typeof value.token_type === "string" &&
    typeof value.expires_in === "number"
  );
}

function isSpaceResponse(value: unknown): value is GoogleMeetSpaceResponse {
  if (!isRecord(value)) return false;
  return (
    typeof value.name === "string" && typeof value.meetingUri === "string" && typeof value.meetingCode === "string"
  );
}

function isErrorResponse(value: unknown): value is GoogleMeetErrorResponse {
  if (!isRecord(value)) return false;
  if (value.error === undefined) return true;
  if (!isRecord(value.error)) return false;
  return typeof value.error.code === "number" && typeof value.error.message === "string";
}

export class GoogleMeetAdapter extends MeetingAdapterBase {
  static readonly ENDPOINTS: readonly string[] = [
    "https://oauth2.googleapis.com/token",
    "https://www.googleapis.com/auth/meetings.space.created",
    "https://meet.googleapis.com/v2/spaces",
  ];
  protected readonly providerSlug = "google_meet" as const;
  protected readonly tokenRefreshMarginMs = TOKEN_REFRESH_MARGIN_MS;

  private readonly rawServiceAccountJson?: string;
  private readonly impersonateSubject?: string;
  private readonly defaultAccessType: number;
  private parsedServiceAccount: ParsedServiceAccount | null = null;

  constructor(opts?: GoogleMeetAdapterOptions) {
    super();
    // If the caller provided a service account JSON explicitly, do not read env
    // config; otherwise load runtime environment configuration.
    const envConfig = opts?.serviceAccountJson != null ? null : getEnvironmentConfig();
    this.rawServiceAccountJson = opts?.serviceAccountJson ?? envConfig?.googleMeetServiceAccountJson;
    this.impersonateSubject = opts?.impersonateSubject ?? envConfig?.googleMeetImpersonateSubject;
    this.defaultAccessType = opts?.defaultAccessType ?? 1;
  }

  async validateConfig(): Promise<boolean> {
    if (this.rawServiceAccountJson == null) {
      logger.warn("GoogleMeetAdapter: missing service account JSON");
      return false;
    }

    if (this.impersonateSubject == null) {
      logger.warn("GoogleMeetAdapter: missing impersonate subject");
      return false;
    }

    try {
      this.parsedServiceAccount = this.parseServiceAccount();
      return true;
    } catch (err: unknown) {
      logger.warn("GoogleMeetAdapter: invalid service account JSON", {
        message: err instanceof Error ? err.message : String(err),
      });
      return false;
    }
  }

  protected async resolveAccessToken(input: GenerateMeetingInput): Promise<string> {
    const hasOrgCreds = !!(this.rawServiceAccountJson && this.impersonateSubject);

    if (hasOrgCreds) {
      const sa = this.parseServiceAccount();
      if (!this.impersonateSubject) {
        throw new MissingImpersonationSubjectError();
      }
      return this.getAccessToken(sa);
    }

    if (input.actorUserId) {
      return this.getPerUserAccessToken(input.actorUserId);
    }

    if (!this.rawServiceAccountJson) {
      throw new NoOrgCredentialsNoUserTokenError("google_meet");
    }
    throw new MissingImpersonationSubjectError();
  }

  protected async callProviderApi(accessToken: string, _input: GenerateMeetingInput): Promise<GenerateMeetingResult> {
    return this.createSpace(accessToken);
  }

  async disconnect(token?: { accessToken: string; refreshToken: string | null }): Promise<void> {
    if (token) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token.accessToken)}`, {
          method: "POST",
        });
      } catch (error) {
        logger.warn("GoogleMeetAdapter: token revocation failed", {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
    this.clearCachedToken();
    this.parsedServiceAccount = null;
  }

  private parseServiceAccount(): ParsedServiceAccount {
    if (this.parsedServiceAccount) return this.parsedServiceAccount;

    if (!this.rawServiceAccountJson) {
      throw new NoOrgCredentialsNoUserTokenError("google_meet");
    }

    let raw: unknown;
    try {
      raw = JSON.parse(this.rawServiceAccountJson);
    } catch {
      throw new InvalidServiceAccountJsonError("Invalid JSON");
    }
    if (!isServiceAccountJson(raw)) {
      throw new InvalidServiceAccountJsonError("Invalid service account structure");
    }
    const parsed: GoogleMeetServiceAccountJson = raw;

    if (parsed.type !== "service_account") {
      throw new InvalidServiceAccountJsonError(`Expected type "service_account", got "${parsed.type}"`);
    }
    if (!parsed.client_email) {
      throw new InvalidServiceAccountJsonError("Missing client_email");
    }
    if (!parsed.private_key) {
      throw new InvalidServiceAccountJsonError("Missing private_key");
    }

    this.parsedServiceAccount = {
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key,
      privateKeyId: parsed.private_key_id ?? "",
    };
    return this.parsedServiceAccount;
  }

  private async getAccessToken(sa: ParsedServiceAccount): Promise<string> {
    if (this.cachedToken && !isTokenExpired(this.cachedToken, this.tokenRefreshMarginMs)) {
      return this.cachedToken.accessToken;
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: sa.clientEmail,
      scope: SCOPE,
      aud: GOOGLE_TOKEN_URL,
      exp: now + 3600,
      iat: now,
      sub: this.impersonateSubject,
    };

    const key = await this.importPrivateKey(sa.privateKey);
    const assertion = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: sa.privateKeyId || undefined })
      .setIssuer(payload.iss)
      .setSubject(payload.sub ?? "")
      .setAudience(payload.aud)
      .setExpirationTime(payload.exp)
      .setIssuedAt(payload.iat)
      .sign(key);

    const body = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    });

    const { signal, cancel } = withTimeout(REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        signal,
      });
    } catch (error) {
      cancel();
      throw new ProviderUnavailableError(
        "google_meet",
        undefined,
        error instanceof Error ? error.message : String(error)
      );
    }
    cancel();

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      throw new RateLimitedError("google_meet", retryAfter ? Number.parseInt(retryAfter, 10) : undefined);
    }

    if (!response.ok) {
      const errorBody = await this.parseErrorBody(response);
      throw new GoogleMeetApiError(
        errorBody?.error?.message ?? `Google token exchange failed (${response.status})`,
        errorBody?.error?.status,
        response.status
      );
    }

    const rawToken: unknown = await response.json();
    if (!isTokenResponse(rawToken)) {
      throw new GoogleMeetApiError("Google token exchange returned malformed response", undefined, response.status);
    }
    const tokenData: GoogleMeetTokenResponse = rawToken;
    this.cachedToken = {
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
    } satisfies CachedToken;
    return tokenData.access_token;
  }

  private async createSpace(accessToken: string): Promise<GenerateMeetingResult> {
    const spaceBody = {
      config: {
        accessType: this.defaultAccessType,
      },
    };

    const response = await this.executeSpaceRequest(accessToken, spaceBody);
    await this.assertSpaceResponseOk(response);

    const rawSpace: unknown = await response.json();
    if (!isSpaceResponse(rawSpace)) {
      throw new GoogleMeetApiError("Google Meet returned malformed space response", undefined, response.status);
    }
    const space: GoogleMeetSpaceResponse = rawSpace;
    return {
      joinUrl: space.meetingUri,
      meetingId: space.name,
      providerMetadata: {
        meetingCode: space.meetingCode,
        spaceName: space.name,
        accessType: space.config?.accessType ?? this.defaultAccessType,
      },
    };
  }

  private async executeSpaceRequest(
    accessToken: string,
    spaceBody: { config: { accessType: number } }
  ): Promise<Response> {
    const { signal, cancel } = withTimeout(REQUEST_TIMEOUT_MS);
    try {
      return await fetch(GOOGLE_MEET_SPACES_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(spaceBody),
        signal,
      });
    } catch (error) {
      throw new ProviderUnavailableError(
        "google_meet",
        undefined,
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      cancel();
    }
  }

  private async assertSpaceResponseOk(response: Response): Promise<void> {
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      throw new RateLimitedError("google_meet", retryAfter ? Number.parseInt(retryAfter, 10) : undefined);
    }

    if (response.status === 403) {
      await this.handleSpace403(response);
      return;
    }

    if (response.status >= 500) {
      const errorBody = await this.parseErrorBody(response);
      throw new ProviderUnavailableError("google_meet", response.status, errorBody?.error?.message);
    }

    if (!response.ok) {
      const errorBody = await this.parseErrorBody(response);
      throw new GoogleMeetApiError(
        errorBody?.error?.message ?? `Google Meet space creation failed (${response.status})`,
        errorBody?.error?.status,
        response.status
      );
    }
  }

  private async handleSpace403(response: Response): Promise<void> {
    const errorBody = await this.parseErrorBody(response);
    const upstreamMessage = errorBody?.error?.message ?? `Google Meet space creation forbidden (${response.status})`;
    const combinedText = `${upstreamMessage} ${errorBody?.error?.status ?? ""}`.toLowerCase();

    // DWD (Domain-Wide Delegation) and service-account issues produce
    // specific error keywords in the Google API response.  Only those
    // should be mapped to PermissionDeniedError.
    const isDwdIssue =
      combinedText.includes("domain-wide") ||
      combinedText.includes("delegation") ||
      combinedText.includes("service account");

    if (isDwdIssue) {
      logger.warn("GoogleMeetAdapter: 403 from spaces endpoint — DWD misconfiguration", {
        upstreamMessage,
        upstreamStatus: errorBody?.error?.status,
      });
      throw new PermissionDeniedError(upstreamMessage, response.status);
    }

    logger.warn("GoogleMeetAdapter: 403 from spaces endpoint — permission denied", {
      upstreamMessage,
      upstreamStatus: errorBody?.error?.status,
    });
    throw new MeetingChannelError(
      `Permission denied by Google Meet: ${upstreamMessage}`,
      "PERMISSION_DENIED",
      upstreamMessage,
      response.status
    );
  }

  private async importPrivateKey(pem: string): Promise<CryptoKey> {
    const pemContents = pem
      .replace("-----BEGIN PRIVATE KEY-----", "")
      .replace("-----END PRIVATE KEY-----", "")
      .replace(/\s/g, "");
    const der = Uint8Array.from(atob(pemContents), c => c.codePointAt(0) ?? 0);
    return crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  }

  private async parseErrorBody(response: Response): Promise<GoogleMeetErrorResponse | null> {
    try {
      const raw: unknown = await response.json();
      if (!isErrorResponse(raw)) {
        return null;
      }
      return raw;
    } catch {
      return null;
    }
  }
}
