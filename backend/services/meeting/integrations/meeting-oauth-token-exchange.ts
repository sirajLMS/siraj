import { getEnvironmentConfig } from "@/backend/lib/env";
import {
  fetchWithTimeout,
  REQUEST_TIMEOUT_MS,
} from "@/backend/services/meeting/channels/__shared__/meetingAdapterBase";
import type { OAuthCallbackConfig, OAuthTokenResponse } from "@/backend/types";

/**
 * Type guard that validates a token-endpoint response conforms to the minimal
 * {@link OAuthTokenResponse} shape. Used instead of `as` to satisfy oxlint's
 * `no-unsafe-type-assertion` rule.
 */
function isOAuthTokenResponse(value: unknown): value is OAuthTokenResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  return (
    "access_token" in value &&
    typeof value.access_token === "string" &&
    "token_type" in value &&
    typeof value.token_type === "string" &&
    "expires_in" in value &&
    typeof value.expires_in === "number" &&
    (!("refresh_token" in value) || value.refresh_token === undefined || typeof value.refresh_token === "string") &&
    (!("scope" in value) || value.scope === undefined || typeof value.scope === "string")
  );
}

/** Caps provider-response excerpts embedded in error messages (~200 chars). */
function truncateForError(text: string): string {
  return text.length > 200 ? `${text.slice(0, 200)}…[truncated]` : text;
}

/**
 * Exchanges an authorization code for provider tokens at the provider's token
 * endpoint. Sends the PKCE `code_verifier` (bound to the S256 challenge sent
 * at authorize time). Throws on non-2xx with a truncated excerpt of the
 * provider's error body — the full upstream body may contain provider-internal
 * detail and must never be embedded verbatim in thrown errors.
 */
export async function exchangeCodeForTokens(
  cfg: OAuthCallbackConfig,
  code: string,
  redirectUri: string,
  codeVerifier: string
): Promise<OAuthTokenResponse> {
  const config = getEnvironmentConfig();

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: cfg.resolveClientId(config),
    client_secret: cfg.resolveClientSecret(config),
    // PKCE (RFC 7636 §4.5): the provider verifies this against the
    // code_challenge sent with the authorize request.
    code_verifier: codeVerifier,
  });

  // Conditionally append provider-specific extra params to avoid creating an
  // effectively empty object via spread when `extraTokenParams` is undefined.
  if (cfg.extraTokenParams) {
    for (const [key, value] of Object.entries(cfg.extraTokenParams)) {
      // Ensure only string values are appended; the config type enforces this,
      // but guard defensively in case of unexpected runtime values.
      if (value != null) params.set(key, value);
    }
  }

  const res = await fetchWithTimeout(
    cfg.buildTokenUrl(config),
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    },
    cfg.providerSlug,
    REQUEST_TIMEOUT_MS
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${cfg.displayName} token exchange failed (${res.status}): ${truncateForError(body)}`);
  }

  const data: unknown = await res.json();
  if (!isOAuthTokenResponse(data)) {
    throw new Error(
      `${cfg.displayName} token exchange returned unexpected shape: ${truncateForError(JSON.stringify(data))}`
    );
  }
  return data;
}
