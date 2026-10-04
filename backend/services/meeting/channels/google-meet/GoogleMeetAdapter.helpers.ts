import { logger } from "@/backend/lib/logger";
import {
  isRecord,
  REQUEST_TIMEOUT_MS,
  withTimeout,
} from "@/backend/services/meeting/channels/__shared__/meetingAdapterBase";
import {
  GoogleMeetApiError,
  MeetingChannelError,
  PermissionDeniedError,
  ProviderUnavailableError,
  RateLimitedError,
} from "@/backend/services/meeting/channels/IMeetingChannel";
import type {
  GoogleMeetErrorResponse,
  GoogleMeetServiceAccountJson,
  GoogleMeetSpaceResponse,
  GoogleMeetTokenResponse,
} from "@/backend/types";

export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const TOKEN_REFRESH_MARGIN_MS = 60_000;
export const SCOPE = "https://www.googleapis.com/auth/meetings.space.created";

const GOOGLE_MEET_SPACES_URL = "https://meet.googleapis.com/v2/spaces";

export interface ParsedServiceAccount {
  readonly clientEmail: string;
  readonly privateKey: string;
  readonly privateKeyId: string;
}

export function isServiceAccountJson(value: unknown): value is GoogleMeetServiceAccountJson {
  if (!isRecord(value)) return false;
  return (
    typeof value.type === "string" && typeof value.client_email === "string" && typeof value.private_key === "string"
  );
}

export function isTokenResponse(value: unknown): value is GoogleMeetTokenResponse {
  if (!isRecord(value)) return false;
  return (
    typeof value.access_token === "string" &&
    typeof value.token_type === "string" &&
    typeof value.expires_in === "number"
  );
}

export function isSpaceResponse(value: unknown): value is GoogleMeetSpaceResponse {
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

export async function parseGoogleMeetErrorBody(response: Response): Promise<GoogleMeetErrorResponse | null> {
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

export async function importGooglePrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const der = Uint8Array.from(atob(pemContents), c => c.codePointAt(0) ?? 0);
  return crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

export async function executeGoogleSpaceRequest(
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

export async function assertGoogleSpaceResponseOk(response: Response): Promise<void> {
  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    throw new RateLimitedError("google_meet", retryAfter ? Number.parseInt(retryAfter, 10) : undefined);
  }

  if (response.status === 403) {
    await handleGoogleSpace403(response);
    return;
  }

  if (response.status >= 500) {
    const errorBody = await parseGoogleMeetErrorBody(response);
    throw new ProviderUnavailableError("google_meet", response.status, errorBody?.error?.message);
  }

  if (!response.ok) {
    const errorBody = await parseGoogleMeetErrorBody(response);
    throw new GoogleMeetApiError(
      errorBody?.error?.message ?? `Google Meet space creation failed (${response.status})`,
      errorBody?.error?.status,
      response.status
    );
  }
}

async function handleGoogleSpace403(response: Response): Promise<void> {
  const errorBody = await parseGoogleMeetErrorBody(response);
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
