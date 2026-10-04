import {
  isRecord,
  REQUEST_TIMEOUT_MS,
  withTimeout,
} from "@/backend/services/meeting/channels/__shared__/meetingAdapterBase";
import {
  MicrosoftTeamsApiError,
  NoAppAccessPolicyError,
  ProviderUnavailableError,
  RateLimitedError,
} from "@/backend/services/meeting/channels/IMeetingChannel";
import type {
  MicrosoftTeamsErrorResponse,
  MicrosoftTeamsMeetingResponse,
  MicrosoftTeamsTokenResponse,
} from "@/backend/types";

export const MS_TOKEN_URL_TEMPLATE = "https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token";
export const MS_GRAPH_BASE = "https://graph.microsoft.com/v1.0";
export const TOKEN_REFRESH_MARGIN_MS = 120_000;

export const MS_TEAMS_REQUIRED_SCOPES = ["OnlineMeetings.ReadWrite.All"] as const;

const MS_GRAPH_SCOPE_PREFIX = "https://graph.microsoft.com/";

export function normalizeScope(scope: string): string {
  return scope.startsWith(MS_GRAPH_SCOPE_PREFIX) ? scope.slice(MS_GRAPH_SCOPE_PREFIX.length) : scope;
}

export function isMicrosoftTeamsTokenResponse(value: unknown): value is MicrosoftTeamsTokenResponse {
  if (!isRecord(value)) return false;
  return (
    typeof value.token_type === "string" &&
    typeof value.expires_in === "number" &&
    typeof value.access_token === "string" &&
    (value.scope === undefined || typeof value.scope === "string")
  );
}

export function isMicrosoftTeamsMeetingResponse(value: unknown): value is MicrosoftTeamsMeetingResponse {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && typeof value.joinWebUrl === "string";
}

function isMicrosoftTeamsErrorResponse(value: unknown): value is MicrosoftTeamsErrorResponse {
  if (!isRecord(value)) return false;
  if (value.error === undefined) return true;
  if (!isRecord(value.error)) return false;
  return typeof value.error.code === "string" && typeof value.error.message === "string";
}

export async function parseMicrosoftTeamsErrorBody(response: Response): Promise<MicrosoftTeamsErrorResponse | null> {
  try {
    const data: unknown = await response.json();
    if (!isMicrosoftTeamsErrorResponse(data)) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export async function postMicrosoftTeamsMeetingRequest(
  url: string,
  accessToken: string,
  meetingBody: { subject: string; startDateTime: string; endDateTime: string }
): Promise<Response> {
  const { signal, cancel } = withTimeout(REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(meetingBody),
      signal,
    });
  } catch (error) {
    throw new ProviderUnavailableError(
      "microsoft_teams",
      undefined,
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    cancel();
  }
}

export async function assertMicrosoftTeamsMeetingResponseOk(response: Response): Promise<void> {
  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    throw new RateLimitedError("microsoft_teams", retryAfter ? Number.parseInt(retryAfter, 10) : undefined);
  }

  if (response.status === 403) {
    const errorBody = await parseMicrosoftTeamsErrorBody(response);
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
    const errorBody = await parseMicrosoftTeamsErrorBody(response);
    throw new ProviderUnavailableError("microsoft_teams", response.status, errorBody?.error?.message);
  }

  if (!response.ok) {
    const errorBody = await parseMicrosoftTeamsErrorBody(response);
    throw new MicrosoftTeamsApiError(
      errorBody?.error?.message ?? `Teams meeting creation failed (${response.status})`,
      errorBody?.error?.code,
      response.status
    );
  }
}
