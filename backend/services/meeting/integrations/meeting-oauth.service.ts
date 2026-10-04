/**
 * Per-user meeting-provider OAuth connect/disconnect service.
 *
 * Strengthens the admin-level `MeetingIntegrationService` (which operates on
 * any user's tokens with `SETTINGS_EDIT_MEETING_INTEGRATIONS`) with
 * self-service OAuth for the logged-in user under the
 * `MEETING_CONFIGS_MANAGE_OWN` permission.
 *
 * The "state" nonce returned by `connectProviderOAuth` is a signed JWT
 * (HS256, 10-minute expiry) carrying `userId`, `providerSlug`, `returnPath`,
 * a random `nonce`, and the PKCE (RFC 7636) `codeVerifier`. The callback
 * handler verifies this JWT to prove the round-trip originated from us before
 * exchanging the authorization code — sending the matching `code_verifier`
 * so only the flow that started the authorize request can redeem the code.
 */

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { GraphQLError } from "graphql";
import { type JWTPayload as JoseJWTPayload, jwtVerify, SignJWT } from "jose";
import { MeetingProviderTokenRepository } from "@/backend/db/repo/meeting/meeting-provider-token.repository";
import { UserRepository } from "@/backend/db/repo/users/user.repository";
import { AppPermission } from "@/backend/enum";
import { getEnvironmentConfig } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { cacheService } from "@/backend/services/cache/CacheServiceFactory";
import { getMeetingChannel } from "@/backend/services/meeting/channels/MeetingChannelFactory";
import {
  buildAuthorizeUrl,
  buildRedirectUri,
} from "@/backend/services/meeting/integrations/meeting-oauth-authorize-urls";
import { exchangeCodeForTokens } from "@/backend/services/meeting/integrations/meeting-oauth-token-exchange";
import { AuditService } from "@/backend/services/system/audit.service";
import type {
  ConnectMeetingProviderOAuthReturnType,
  ConnectMeetingProviderOAuthSubmitInput,
  CreateAuditLogInput,
  DisconnectMeetingProviderOAuthReturnType,
  DisconnectMeetingProviderOAuthSubmitInput,
  MeetingOAuthStatePayload,
  MeetingProvider,
  MeetingProviderTokenSelectType,
  MeetingProviderTokenUpsertInput,
  MyConnectedMeetingProviderReturnType,
  OAuthCallbackConfig,
} from "@/backend/types";
import { isRelativeSafePath } from "@/shared/lib/safe-path";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Validates that `returnPath` is a safe relative path to prevent open
 * redirect attacks, handling percent/double-encoding, backslashes, and control characters.
 */
function validateReturnPath(returnPath: string, tErrors: ErrorsLabels): void {
  if (!isRelativeSafePath(returnPath)) {
    throw new GraphQLError(tErrors.meetingProvider.invalidReturnPath);
  }
}

// ============================================================================
// Constants
// ============================================================================

/** OAuth state JWT expiry — 10 minutes. */
const OAUTH_STATE_EXPIRY = "10m";

// ============================================================================
// Permission assertion (self-service — own meeting configs)
// ============================================================================

async function assertCanManageOwnMeetingConfigs(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
  const has = await PermissionsService.hasPermission(actorUserId, AppPermission.MEETING_CONFIGS_MANAGE_OWN);
  if (!has) {
    throw new Error(tErrors.unauthorizedAction);
  }
}

// ============================================================================
// State JWT helpers
// ============================================================================

const MEETING_PROVIDERS: readonly MeetingProvider[] = ["zoom", "google_meet", "microsoft_teams"];

function isMeetingProvider(value: string): value is MeetingProvider {
  return (MEETING_PROVIDERS as readonly string[]).includes(value);
}

/** Payload shape after verification — the RFC 7636 code_verifier is required. */
export type VerifiedOAuthState = MeetingOAuthStatePayload & { codeVerifier: string };

function isOAuthStatePayload(payload: JoseJWTPayload): payload is VerifiedOAuthState {
  return (
    typeof payload.userId === "string" &&
    typeof payload.providerSlug === "string" &&
    isMeetingProvider(payload.providerSlug) &&
    typeof payload.returnPath === "string" &&
    typeof payload.nonce === "string" &&
    typeof payload.sessionId === "string" &&
    // PKCE (S256): states minted since the PKCE fix carry a code_verifier.
    // Require it — the 10-minute state TTL means legacy states without a
    // verifier are already expired, so no overlap tolerance is needed.
    typeof payload.codeVerifier === "string"
  );
}

function getStateSigningSecret(): Uint8Array {
  const config = getEnvironmentConfig();
  return new TextEncoder().encode(config.jwtSecret);
}

/** H1 fix: single-use nonce window — matches OAUTH_STATE_EXPIRY (10m) in ms. */
const OAUTH_STATE_NONCE_TTL_MS = 10 * 60 * 1000;

/** PKCE (S256): base64url-encode bytes per RFC 7636 (unpadded). */
function base64UrlEncode(bytes: Uint8Array): string {
  const base64 = Buffer.from(bytes).toString("base64");
  return base64.split("=")[0].split("+").join("-").split("/").join("_");
}

/** PKCE (S256): derives the code_challenge sent with the authorize request. */
function pkceCodeChallenge(codeVerifier: string): string {
  const digest = createHash("sha256").update(codeVerifier).digest();
  return base64UrlEncode(digest);
}

async function signOAuthState(
  userId: string,
  providerSlug: MeetingProvider,
  returnPath: string,
  sessionId: string
): Promise<{ state: string; codeVerifier: string }> {
  const nonce = randomUUID();
  // PKCE (S256): 32 random bytes, base64url-encoded per RFC 7636 §4.1. Stored
  // inside the signed state JWT so it travels with the session-bound,
  // single-use state — no separate storage to race or leak.
  const codeVerifier = base64UrlEncode(new Uint8Array(randomBytes(32)));
  // H1 fix: claim the nonce in the cache so collisions (a second state minted
  // with the same nonce) are rejected at signing time. setNx is atomic —
  // returns "OK" on success, null if the key already exists.
  const nonceKey = `oauth:nonce:${nonce}`;
  const claimed = await cacheService.setNx(nonceKey, "1", OAUTH_STATE_NONCE_TTL_MS);
  if (claimed === null) {
    throw new GraphQLError("oauthStateCollision");
  }
  const state = await new SignJWT({
    userId,
    providerSlug,
    returnPath,
    nonce,
    sessionId,
    codeVerifier,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(OAUTH_STATE_EXPIRY)
    .sign(getStateSigningSecret());
  return { state, codeVerifier };
}

/**
 * Verifies a state JWT AND enforces H1 single-use + session binding:
 * - the JWT signature must be valid (proves we minted it);
 * - `payload.sessionId` must equal `expectedSessionId` (binds to the caller's
 *   browser session — a stolen state replayed from a different browser is
 *   rejected);
 * - the nonce must not have been consumed before (atomic single-use via
 *   setNx of a consumed-marker — `cacheService.del` returns void so the
 *   del-then-get pattern would be racy).
 *
 * Returns the payload on success, or null on any failure (expired, bad sig,
 * session mismatch, replayed nonce). Callers treat null as invalid state.
 */
export async function verifyAndConsumeOAuthState(
  state: string,
  expectedSessionId: string | undefined
): Promise<VerifiedOAuthState | null> {
  try {
    const { payload } = await jwtVerify(state, getStateSigningSecret(), { algorithms: ["HS256"] });
    if (!isOAuthStatePayload(payload)) return null;
    // H1 fix: bind state to the caller's session cookie. A state minted for
    // session A must not be redeemable by session B.
    if (!expectedSessionId || payload.sessionId !== expectedSessionId) {
      logger.warn("OAuth state rejected: session mismatch", {
        stateSessionId: payload.sessionId,
        hasExpected: Boolean(expectedSessionId),
      });
      return null;
    }
    // H1 fix: atomic single-use consume. setNx returns "OK" only the first
    // time the consumed-marker is set; a second call (replay) returns null.
    const consumedKey = `oauth:nonce:consumed:${payload.nonce}`;
    const consumed = await cacheService.setNx(consumedKey, "1", OAUTH_STATE_NONCE_TTL_MS);
    if (consumed === null) {
      logger.warn("OAuth state rejected: nonce already consumed (replay)", {
        nonce: payload.nonce,
      });
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// ============================================================================
// OAuth callback redirect
// ============================================================================

/**
 * Builds the redirect URI for a provider's OAuth callback. Mirrors the
 * `buildRedirectUri` helper used by the authorize-URL builders.
 */
export function buildCallbackRedirectUri(providerSlug: MeetingProvider): string {
  const config = getEnvironmentConfig();
  const baseUrlRaw = config.oauthRedirectBaseUrl ?? config.nextPublicBaseUrl ?? "";
  const baseUrl = baseUrlRaw.endsWith("/") ? baseUrlRaw.slice(0, -1) : baseUrlRaw;
  const pathSlug = providerSlug.split("_").join("-");
  return `${baseUrl}/api/oauth/${pathSlug}/callback`;
}

// ============================================================================
// Public API
// ============================================================================

export namespace MeetingOAuthService {
  /**
   * Mint a signed state JWT and build the provider's authorize URL for the
   * logged-in user to start the OAuth flow.
   */
  export async function connectProviderOAuth(
    input: ConnectMeetingProviderOAuthSubmitInput,
    actorUserId: string,
    sessionId: string | undefined,
    tErrors: ErrorsLabels
  ): Promise<ConnectMeetingProviderOAuthReturnType> {
    await assertCanManageOwnMeetingConfigs(actorUserId, tErrors);

    validateReturnPath(input.returnPath, tErrors);

    // H1 fix: require a session so the signed state can be bound to it.
    // Anonymous callers cannot reach here (authScopes: { loggedIn: true }),
    // but sessionId may still be absent for token-only auth — reject defensively.
    if (!sessionId) {
      throw new GraphQLError(tErrors.unauthorizedAction);
    }

    const { state, codeVerifier } = await signOAuthState(actorUserId, input.providerSlug, input.returnPath, sessionId);
    const redirectUri = buildRedirectUri(input.providerSlug);
    const authorizeUrl = buildAuthorizeUrl(input.providerSlug, redirectUri, state, pkceCodeChallenge(codeVerifier));

    logger.info("Meeting OAuth: connect initiated", {
      actorUserId,
      providerSlug: input.providerSlug,
    });

    return { authorizeUrl, state };
  }

  /**
   * Best-effort revoke provider access, delete the stored token row, and
   * audit the disconnection. Returns `{ ok, providerSlug }`.
   */
  export async function disconnectProviderOAuth(
    input: DisconnectMeetingProviderOAuthSubmitInput,
    actorUserId: string,
    tErrors: ErrorsLabels
  ): Promise<DisconnectMeetingProviderOAuthReturnType> {
    await assertCanManageOwnMeetingConfigs(actorUserId, tErrors);

    // Fetch decrypted token row before deletion so we can revoke at provider
    const tokenRow = await MeetingProviderTokenRepository.getByUserAndProvider(actorUserId, input.providerSlug);

    // Best-effort adapter disconnect — revokes at provider & clears cached tokens
    try {
      const adapter = await getMeetingChannel(input.providerSlug);
      await adapter.disconnect(
        tokenRow?.accessToken ? { accessToken: tokenRow.accessToken, refreshToken: tokenRow.refreshToken } : undefined
      );
    } catch (error) {
      logger.warn("Meeting OAuth: best-effort adapter disconnect failed", {
        providerSlug: input.providerSlug,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    await MeetingProviderTokenRepository.deleteByUserAndProvider(actorUserId, input.providerSlug);

    const auditInput: CreateAuditLogInput = {
      actorUserId,
      actorType: "USER",
      entityType: "MEETING_PROVIDER_TOKEN",
      entityId: `${actorUserId}:${input.providerSlug}`,
      action: "REVOKE",
      description: `meeting_provider_token.disconnected (self-service) for user ${actorUserId} on ${input.providerSlug}`,
      previousState: null,
      newState: null,
      metadata: {
        event: "meeting_provider_token.disconnected",
        userId: actorUserId,
        providerSlug: input.providerSlug,
      },
    };

    try {
      await AuditService.createManyAuditLogs([auditInput]);
    } catch {
      // best-effort — audit failure should not block disconnection
    }

    return {
      ok: true,
      providerSlug: input.providerSlug,
    };
  }

  /**
   * List the caller's own connected OAuth provider tokens with email from the
   * users table. Self-service (requires `MEETING_CONFIGS_MANAGE_OWN`).
   */
  export async function listOwnConnectedProviders(
    actorUserId: string,
    tErrors: ErrorsLabels
  ): Promise<MyConnectedMeetingProviderReturnType[]> {
    await assertCanManageOwnMeetingConfigs(actorUserId, tErrors);

    const tokens = await MeetingProviderTokenRepository.listByUser(actorUserId);
    const user = await UserRepository.findById(actorUserId);
    const email = user?.email ?? null;

    return tokens.reduce<MyConnectedMeetingProviderReturnType[]>((acc, token) => {
      if (isMeetingProvider(token.providerSlug)) {
        acc.push({
          providerSlug: token.providerSlug,
          email,
          connectedAt: token.createdAt ?? null,
          expiresAt: token.expiresAt ?? null,
        });
      }
      return acc;
    }, []);
  }

  /**
   * Exchanges an authorization code for provider tokens at the provider's
   * token endpoint, computes the expiry timestamp, and upserts the decrypted
   * token row for the user — the full callback-side persistence leg.
   *
   * This is the service-layer counterpart to the callback handler: the route
   * handler stays responsible for HTTP request/response only, while this
   * method owns the external HTTP exchange + database persistence.
   *
   * @returns the upserted token row (decrypted, fresh from the DB).
   */
  export async function exchangeAndPersistTokens(
    cfg: OAuthCallbackConfig,
    userId: string,
    code: string,
    redirectUri: string,
    codeVerifier: string
  ): Promise<MeetingProviderTokenSelectType> {
    const tokenResponse = await exchangeCodeForTokens(cfg, code, redirectUri, codeVerifier);
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

    const upsertInput: MeetingProviderTokenUpsertInput = {
      userId,
      providerSlug: cfg.providerSlug,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token ?? null,
      expiresAt,
      scopes: tokenResponse.scope ? tokenResponse.scope.split(" ") : [],
    };

    const persisted = await MeetingProviderTokenRepository.upsert(upsertInput);

    logger.info("Meeting OAuth: tokens persisted", {
      userId,
      providerSlug: cfg.providerSlug,
    });

    return persisted;
  }
}
