/**
 * Shared OAuth callback handler for the three meeting-provider connect flows
 * (Zoom, Google Meet, Microsoft Teams).
 *
 * All three `app/api/oauth/<provider>/callback/route.ts` files share ~90%
 * identical structure — only the provider slug, token-endpoint URL,
 * client-id/secret fields, and optional extra form params differ. This module
 * owns the common GET flow (code/state extraction, state verification, slug
 * check, open-redirect guard, token exchange, upsert, redirect) and exposes a
 * single {@link handleOAuthCallback} entry point that each route calls with a
 * provider-specific config.
 */

import { type NextRequest, NextResponse } from "next/server";

import { MeetingProviderTokenRepository } from "@/backend/db/repo/meeting/meeting-provider-token.repository";
import { ensureEnvironmentValidated, getEnvironmentConfig } from "@/backend/lib/env";
import logger from "@/backend/lib/logger";
import type { MeetingProvider } from "@/backend/services/meeting/channels/IMeetingChannel";
import { verifyOAuthState } from "@/backend/services/meeting/integrations/meeting-oauth.service";

ensureEnvironmentValidated();

/** Minimal token-response shape every provider returns from its token endpoint. */
export interface OAuthTokenResponse {
  readonly access_token: string;
  readonly token_type: string;
  readonly expires_in: number;
  readonly refresh_token?: string;
  readonly scope?: string;
}

/**
 * Provider-specific callback configuration.
 *
 * Each route file constructs one of these and passes it to
 * {@link handleOAuthCallback}. Only the bits that genuinely vary between
 * providers live here — the shared flow lives in the helper.
 */
export interface OAuthCallbackConfig {
  /** Canonical meeting-provider slug. */
  readonly providerSlug: MeetingProvider;
  /** Human-readable provider name used in log messages (e.g. "Zoom"). */
  readonly displayName: string;
  /**
   * Builds the absolute token-endpoint URL for the code-for-tokens exchange.
   * Receives the resolved environment config so MS Teams can read its
   * tenant id, etc.
   */
  readonly buildTokenUrl: (config: ReturnType<typeof getEnvironmentConfig>) => string;
  /** Returns the OAuth client id for this provider from env config. */
  readonly resolveClientId: (config: ReturnType<typeof getEnvironmentConfig>) => string;
  /** Returns the OAuth client secret for this provider from env config. */
  readonly resolveClientSecret: (config: ReturnType<typeof getEnvironmentConfig>) => string;
  /**
   * Optional extra form params to merge into the token-exchange body
   * (e.g. MS Teams sends `scope`). The base params (`grant_type`, `code`,
   * `redirect_uri`, `client_id`, `client_secret`) are always included.
   */
  readonly extraTokenParams?: Record<string, string>;
}

/**
 * Builds the redirect URI for this provider's callback. Mirrors the logic in
 * `meeting-oauth.service.ts` — kept local rather than exported from there to
 * keep the callback handler self-contained and side-effect-free.
 */
function buildRedirectUri(providerSlug: MeetingProvider): string {
  const config = getEnvironmentConfig();
  const baseUrlRaw = config.oauthRedirectBaseUrl ?? config.nextPublicBaseUrl ?? "";
  const baseUrl = baseUrlRaw.endsWith("/") ? baseUrlRaw.slice(0, -1) : baseUrlRaw;
  const pathSlug = providerSlug.replaceAll("_", "-");
  return `${baseUrl}/api/oauth/${pathSlug}/callback`;
}

/**
 * Exchanges an authorization code for provider tokens at the provider's token
 * endpoint. Throws on non-2xx with the provider's error body for diagnostics.
 */
async function exchangeCodeForTokens(
  cfg: OAuthCallbackConfig,
  code: string,
  redirectUri: string
): Promise<OAuthTokenResponse> {
  const config = getEnvironmentConfig();

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: cfg.resolveClientId(config),
    client_secret: cfg.resolveClientSecret(config),
  });

  // Conditionally append provider-specific extra params to avoid creating an
  // effectively empty object via spread when `extraTokenParams` is undefined.
  if (cfg.extraTokenParams) {
    for (const [key, value] of Object.entries(cfg.extraTokenParams)) {
      // Ensure only string values are appended; the config type enforces this,
      // but guard defensively in case of unexpected runtime values.
      if (value != null) params.set(key, String(value));
    }
  }

  const res = await fetch(cfg.buildTokenUrl(config), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${cfg.displayName} token exchange failed (${res.status}): ${body}`);
  }

  return (await res.json()) as OAuthTokenResponse;
}

/**
 * Runs the full OAuth callback GET flow for a single provider and returns the
 * final {@link NextResponse} (always either a JSON error or a 302 redirect).
 *
 * Route handlers should call this directly from their `GET` export:
 *
 * ```ts
 * export async function GET(request: NextRequest): Promise<NextResponse> {
 *   return handleOAuthCallback(request, zoomConfig);
 * }
 * ```
 */
export async function handleOAuthCallback(request: NextRequest, cfg: OAuthCallbackConfig): Promise<NextResponse> {
  const { providerSlug, displayName } = cfg;
  const logTag = `${displayName} OAuth callback`;

  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state parameter" }, { status: 400 });
  }

  const statePayload = await verifyOAuthState(state);
  if (!statePayload) {
    return NextResponse.json({ error: "Invalid or expired OAuth state" }, { status: 400 });
  }

  if (statePayload.providerSlug !== providerSlug) {
    logger.warn(`${logTag}: provider slug mismatch in state`, {
      expected: providerSlug,
      actual: statePayload.providerSlug,
    });
    return NextResponse.json({ error: "Provider mismatch in OAuth state" }, { status: 400 });
  }

  const { userId, returnPath } = statePayload;
  const redirectUri = buildRedirectUri(providerSlug);

  // Defense-in-depth: validate returnPath to prevent open redirect
  if (!returnPath.startsWith("/") || returnPath.startsWith("//")) {
    logger.warn(`${logTag}: invalid return path detected`, { returnPath });
    return NextResponse.json({ error: "Invalid return path" }, { status: 400 });
  }

  try {
    const tokenResponse = await exchangeCodeForTokens(cfg, code, redirectUri);
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

    await MeetingProviderTokenRepository.upsert({
      userId,
      providerSlug,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token ?? null,
      expiresAt,
      scopes: tokenResponse.scope ? tokenResponse.scope.split(" ") : [],
    });

    logger.info(`${logTag}: tokens persisted`, { userId });
  } catch (error) {
    logger.error(`${logTag}: token exchange or persistence failed`, {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to complete OAuth token exchange" }, { status: 502 });
  }

  return NextResponse.redirect(new URL(returnPath, url.origin), 302);
}
