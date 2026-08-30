/**
 * Shared OAuth callback handler for the three meeting-provider connect flows
 * (Zoom, Google Meet, Microsoft Teams).
 *
 * All three `app/api/oauth/<provider>/callback/route.ts` files share ~90%
 * identical structure — only the provider slug, token-endpoint URL,
 * client-id/secret fields, and optional extra form params differ. This module
 * owns the common GET flow (code/state extraction, state verification, slug
 * check, open-redirect guard) and delegates the token exchange + persistence
 * to {@link MeetingOAuthService.exchangeAndPersistTokens}.
 *
 * The route handler stays responsible for HTTP request/response only — all
 * business logic (external HTTP exchange, database upsert) lives in the
 * service layer per AGENTS.md rules.
 */

import { type NextRequest, NextResponse } from "next/server";

import { getServerUserContext } from "@/backend/lib";
import { ensureEnvironmentValidated } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import { buildCallbackRedirectUri, MeetingOAuthService, verifyAndConsumeOAuthState } from "@/backend/services";
import type { OAuthCallbackConfig } from "@/backend/types";
import { isRelativeSafePath } from "@/frontend/common/lib/safeRedirect";

import { getServerTranslations } from "@/shared/locale";

// Re-export the config type so the three route files that import it from this
// module continue to work without changing their import paths.

ensureEnvironmentValidated();

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

  const locale = request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ?? "ar";
  const tErrors = getServerTranslations(locale).errorsTranslations;

  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ error: tErrors.missingCodeOrState }, { status: 400 });
  }

  const statePayload = await verifyAndConsumeOAuthState(state, request.cookies.get("session_id")?.value);
  if (!statePayload) {
    return NextResponse.json({ error: tErrors.invalidOrExpiredOAuthState }, { status: 400 });
  }

  if (statePayload.providerSlug !== providerSlug) {
    logger.warn(`${logTag}: provider slug mismatch in state`, {
      expected: providerSlug,
      actual: statePayload.providerSlug,
    });
    return NextResponse.json({ error: tErrors.providerMismatch }, { status: 400 });
  }

  // H5 fix: verify the authenticated session user matches the state payload user.
  // Prevents token binding to the wrong account if a signed state is replayed
  // within the 10-minute window by a different user.
  const { userId: sessionUserId } = await getServerUserContext();
  if (!sessionUserId || sessionUserId !== statePayload.userId) {
    logger.warn(`${logTag}: session/state user mismatch`, {
      stateUserId: statePayload.userId,
      sessionUserId,
    });
    return NextResponse.json({ error: tErrors.invalidOrExpiredOAuthState }, { status: 400 });
  }

  const { userId, returnPath } = statePayload;
  const redirectUri = buildCallbackRedirectUri(providerSlug);

  // Defense-in-depth: validate returnPath to prevent open redirect
  if (!isRelativeSafePath(returnPath) || returnPath.includes("://")) {
    logger.warn(`${logTag}: invalid return path detected`, { returnPath });
    return NextResponse.json({ error: tErrors.meetingProvider.invalidReturnPath }, { status: 400 });
  }

  try {
    await MeetingOAuthService.exchangeAndPersistTokens(cfg, userId, code, redirectUri);
  } catch (error) {
    logger.error(`${logTag}: token exchange or persistence failed`, {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: tErrors.failedToCompleteOAuthTokenExchange }, { status: 502 });
  }

  return NextResponse.redirect(new URL(returnPath, url.origin), 302);
}
