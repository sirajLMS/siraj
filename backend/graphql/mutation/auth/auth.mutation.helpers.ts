import { hashSync } from "bcryptjs";
import { GraphQLError } from "graphql";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { generateAccessToken, generateRefreshToken, isTransientError, verifyToken } from "@/backend/lib";
import { setAuthCookies as applyAuthCookies } from "@/backend/lib/auth/cookies";
import { logger } from "@/backend/lib/logger";
import {
  ImpersonationService,
  PermissionGroupSimulationService,
  SessionService,
  UserService,
} from "@/backend/services";
import { purgeOrphanSession } from "@/backend/services/auth/session.service";
import type { SessionSelectType, UserReturnType, UserSelectType } from "@/backend/types";
import { AuthUtils } from "@/backend/utils";

/**
 * Fixed input string whose bcrypt hash is compared when the login email matches
 * no user. Running the same bcrypt cost as real password verification keeps the
 * unknown-email failure path indistinguishable in time from the known-email
 * wrong-password path.
 */
const TIMING_EQUALIZER_PAD = "siraj-timing-equalizer-1f4c9d";
const DUMMY_HASH_ROUNDS = 12;

// Precomputed at module load so no request thread ever runs the synchronous
// bcrypt hash; the unknown-email failure path only pays an async compare.
export const DUMMY_PASSWORD_HASH = hashSync(TIMING_EQUALIZER_PAD, DUMMY_HASH_ROUNDS);

export function setAuthCookies(ctx: BaseContext, sessionId: string, refreshToken: string, accessToken?: string) {
  applyAuthCookies(ctx.cookies, sessionId, refreshToken, accessToken);
}

/**
 * Execute a rate-limit operation with fail-open behavior for transient errors.
 * Non-transient errors are re-thrown (fail-closed) to prevent silently disabling
 * brute-force protection on persistent failures.
 */
export async function failOpen<T>(operation: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (isTransientError(error)) {
      logger.error(`${operation} failed (transient infrastructure error), failing open`);
      return fallback;
    }
    throw error;
  }
}

export async function resolveUserFromSession(
  sessionId: string
): Promise<{ session: SessionSelectType | null; user: UserSelectType | null }> {
  // skipUserCheck: the caller immediately fetches the user via findById below,
  // so the findSafeById verification inside validateSession would be redundant.
  const session = await SessionService.validateSession(sessionId, { skipUserCheck: true });
  if (!session?.userId) return { session: session ?? null, user: null };

  const user = (await UserService.findById(session.userId)) ?? null;
  if (!user) {
    logger.warn("[RefreshToken] Session found but user not found, purging orphan session", {
      userId: session.userId,
      sessionId,
    });
    await purgeOrphanSession(sessionId, session.userId);
    return { session: null, user: null };
  }
  return { session, user };
}

export async function resolveUserFromRefreshToken(
  refreshToken: string
): Promise<{ session: SessionSelectType | null; user: UserSelectType | null }> {
  const payload = await verifyToken(refreshToken);
  if (payload?.type !== "refresh") return { session: null, user: null };

  const user = (await UserService.findById(payload.userId)) ?? null;
  if (!user) return { session: null, user: null };

  const session = (await SessionService.findByUserId(user.id)) ?? null;
  if (!session) {
    logger.warn("[RefreshToken] User found but no session exists", {
      userId: user.id,
    });
  }
  return { session, user };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSessionPayload(payload: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(payload);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function logStaleRefreshTokenJti(sessionJti: string, cookieJti: string): void {
  logger.warn("[RefreshToken] Stale refresh_token JTI with valid session_id; allowing rotation", {
    sessionJti,
    cookieJti,
  });
}

function warnIfStaleRefreshTokenJti(
  refreshToken: string | undefined,
  refreshPayload: Awaited<ReturnType<typeof verifyToken>> | null,
  session: SessionSelectType
): void {
  if (!refreshToken || !refreshPayload?.jti || !session.payload) return;

  const sessionData = parseSessionPayload(session.payload);
  const sessionJti = sessionData?.refreshTokenJti;
  if (typeof sessionJti === "string" && sessionJti !== refreshPayload.jti) {
    logStaleRefreshTokenJti(sessionJti, refreshPayload.jti);
  }
}

function jtiMatchesSession(
  refreshPayload: Awaited<ReturnType<typeof verifyToken>> | null,
  session: SessionSelectType
): boolean {
  if (!refreshPayload?.jti && !session.payload) return true;
  if (!refreshPayload?.jti || !session.payload) return false;

  const sessionData = parseSessionPayload(session.payload);
  const sessionJti = sessionData?.refreshTokenJti;
  return !(typeof sessionJti === "string" && sessionJti !== refreshPayload.jti);
}

export async function validateRefreshTokenJti(
  refreshToken: string | undefined,
  session: SessionSelectType,
  resolvedViaSessionId = false
): Promise<boolean> {
  // A valid session_id cookie is authoritative. Stale refresh_token cookies can linger
  // after rotation (e.g. client still holds pre-refresh cookie while session JTI updated).
  if (resolvedViaSessionId) {
    if (refreshToken) {
      const refreshPayload = await verifyToken(refreshToken);
      warnIfStaleRefreshTokenJti(refreshToken, refreshPayload, session);
    }
    return true;
  }

  const refreshPayload = refreshToken ? await verifyToken(refreshToken) : null;
  return jtiMatchesSession(refreshPayload, session);
}

export async function rotateTokensAndSession(
  user: UserSelectType,
  session: SessionSelectType,
  ctx: BaseContext,
  rawSessionId?: string
): Promise<{ token: string; user: UserReturnType } | null> {
  const sessionIdForUpdate = rawSessionId ?? session.hashedId;
  const tErrors = ctx.t().errorsTranslations;
  const newAccessToken =
    (rawSessionId ? await ImpersonationService.issueAccessTokenForSession(user.id, rawSessionId) : null) ??
    (rawSessionId ? await PermissionGroupSimulationService.issueAccessTokenForSession(user.id, rawSessionId) : null) ??
    (await generateAccessToken(user.id, user.email));
  const newRefreshToken = await generateRefreshToken(user.id, user.email);

  const newPayload = await verifyToken(newRefreshToken);
  const newJti = newPayload?.jti;

  const sessionPayload = session.payload ? JSON.parse(session.payload) : {};
  sessionPayload.refreshTokenJti = newJti;

  // Use the raw (plaintext) session ID for the update call — the repository
  // hashes it internally before storage lookup.
  await SessionService.updateSession({
    hashedId: sessionIdForUpdate,
    userId: session.userId,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    payload: JSON.stringify(sessionPayload),
  });

  // The cookie must store the *raw* session ID so it can be looked up again.
  if (rawSessionId) {
    setAuthCookies(ctx, rawSessionId, newRefreshToken, newAccessToken);
  }

  // Reuse the already-loaded `user` when not impersonating (effectiveUserId === user.id).
  // Only fetch from DB when impersonating (effectiveUserId !== user.id).
  const effectiveUserId = ctx.isImpersonating && ctx.user ? ctx.user.id : user.id;
  let effectiveUser: UserSelectType;
  if (effectiveUserId === user.id) {
    effectiveUser = user;
  } else {
    const impersonatedUser = await UserService.findById(effectiveUserId);
    if (!impersonatedUser) {
      throw new GraphQLError(tErrors.auth.impersonationTargetNotFound, {
        extensions: { code: "FORBIDDEN" },
      });
    }
    effectiveUser = impersonatedUser;
  }

  return { token: newAccessToken, user: AuthUtils.toSafeUser(AuthUtils.toUserReturnType(effectiveUser)) };
}
