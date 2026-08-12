import { cookies } from "next/headers";
import { cache } from "react";
import { UserRepository } from "@/backend/db/repo/users";
import { UserRole } from "@/backend/enum";
import { type CustomJWTPayload, logger, verifyToken } from "@/backend/lib";
import {
  ImpersonationService,
  PermissionGroupSimulationService,
  PermissionsService,
  SessionService,
  type UserPermissionContext,
} from "@/backend/services";

type ServerUserContextResult = {
  userId: string | null;
  actorUserId?: string;
  isImpersonating: boolean;
  isSimulatingGroup: boolean;
  simulatedGroupSlug?: string;
  context: UserPermissionContext | null;
};

function emptyContextResult(): ServerUserContextResult {
  return { userId: null, isImpersonating: false, isSimulatingGroup: false, context: null };
}

async function getSessionCookies(): Promise<{ sessionId: string | null; token: string | null }> {
  const cookieStore = await cookies();
  return {
    sessionId: cookieStore.get("session_id")?.value ?? null,
    token: cookieStore.get("access_token")?.value ?? null,
  };
}

/**
 * Validate the long-lived `session_id` cookie against the DB session store.
 * The `session_id` cookie has a 7-day lifetime and survives the 15-minute
 * `access_token` cookie expiry window — so it is the right anchor for SSR
 * auth (see docs/auth/REDIRECT_LOOP_FIX.md). Returns the userId bound to the
 * session, or null when the session is missing/invalid.
 */
async function validateSession(sessionId: string): Promise<{ userId: string } | null> {
  let session: Awaited<ReturnType<typeof SessionService.validateSession>>;
  try {
    session = await SessionService.validateSession(sessionId);
  } catch (error) {
    logger.error("Session validation system error", {
      error: error instanceof Error ? error.constructor.name : String(error),
    });
    throw error;
  }

  if (!session?.userId) {
    logger.info("[AuthRedirect] getServerUserContext: session validation returned no userId", {
      hasSession: Boolean(session),
    });
    return null;
  }

  return { userId: session.userId };
}

/**
 * Verify the short-lived `access_token` cookie JWT. The cookie expires after
 * 15 minutes by design (matches `JWT_ACCESS_TOKEN_EXPIRY`); an absent or
 * expired cookie here does NOT invalidate the SSR session — the caller falls
 * back to session-only auth + a baseline permission context.
 */
async function verifyAccessToken(token: string): Promise<CustomJWTPayload | null> {
  const payload = await verifyToken(token);
  if (payload?.type !== "access") {
    logger.info("[AuthRedirect] getServerUserContext: access token invalid or wrong type", {
      tokenType: payload?.type ?? null,
    });
    return null;
  }
  return payload;
}

async function resolveImpersonation(
  payload: CustomJWTPayload,
  sessionId: string
): Promise<ServerUserContextResult | null> {
  const identity = await ImpersonationService.resolveAuthIdentityFromToken(payload, sessionId);
  if (!identity) {
    logger.info("[AuthRedirect] getServerUserContext: impersonation identity resolution failed");
    return null;
  }

  if (identity.isImpersonating) {
    const context = await PermissionsService.getUserContext(identity.effectiveUserId);
    return {
      userId: identity.effectiveUserId,
      actorUserId: identity.actorUserId,
      isImpersonating: true,
      isSimulatingGroup: false,
      context,
    };
  }

  return null;
}

async function resolveGroupSimulation(
  payload: CustomJWTPayload,
  sessionId: string
): Promise<ServerUserContextResult | null> {
  const identity = await PermissionGroupSimulationService.resolveGroupSimulationFromToken(payload, sessionId);
  if (!identity) {
    logger.info("[AuthRedirect] getServerUserContext: group simulation identity resolution failed");
    return null;
  }

  const context =
    identity.isSimulatingGroup && identity.simulatedGroupSlug
      ? await PermissionsService.getPermissionGroupContext(identity.simulatedGroupSlug)
      : await PermissionsService.getUserContext(identity.realUserId);

  return {
    userId: identity.realUserId,
    isImpersonating: false,
    isSimulatingGroup: identity.isSimulatingGroup,
    simulatedGroupSlug: identity.simulatedGroupSlug,
    context,
  };
}

/**
 * Baseline context when the `access_token` cookie is absent/expired but the
 * `session_id` cookie still resolves to a valid DB session. The client-side
 * `AuthProvider` will rotate the access token via the `refreshToken` GraphQL
 * mutation on the next mount/reload; in the meantime SSR must not bounce the
 * user to /login just because the 15-min cookie expired between navigations.
 */
async function buildSessionOnlyContext(userId: string): Promise<ServerUserContextResult> {
  const context = await PermissionsService.getUserContext(userId);
  if (context.role === UserRole.GUEST) {
    const user = await UserRepository.findSafeById(userId);
    if (!user) {
      logger.warn("[AuthRedirect] getServerUserContext: session refers to non-existent user", { userId });
      return emptyContextResult();
    }
  }
  return {
    userId,
    isImpersonating: false,
    isSimulatingGroup: false,
    context,
  };
}

async function getServerUserContextImpl(): Promise<ServerUserContextResult> {
  const { sessionId, token } = await getSessionCookies();

  if (!sessionId) {
    logger.info("[AuthRedirect] getServerUserContext: no session_id cookie", {
      hasSessionId: false,
      hasAccessToken: Boolean(token),
    });
    return emptyContextResult();
  }

  const sessionInfo = await validateSession(sessionId);
  if (!sessionInfo) {
    return emptyContextResult();
  }

  // No access_token cookie (or it expired after 15 min). Trust the long-lived
  // session_id cookie alone — the documented architecture (see
  // docs/auth/REDIRECT_LOOP_FIX.md) treats absence of the access_token cookie
  // as "stale cookie, client will rotate", not as "logged out".
  if (!token) {
    logger.info("[AuthRedirect] getServerUserContext: no access_token cookie — using session-only auth", {
      hasSessionId: true,
      hasAccessToken: false,
      userId: sessionInfo.userId,
    });
    return buildSessionOnlyContext(sessionInfo.userId);
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    logger.info("[AuthRedirect] getServerUserContext: access_token cookie expired/invalid — using session-only auth", {
      hasSessionId: true,
      hasAccessToken: true,
      userId: sessionInfo.userId,
    });
    return buildSessionOnlyContext(sessionInfo.userId);
  }

  const impersonationResult = await resolveImpersonation(payload, sessionId);
  if (impersonationResult !== null) {
    return impersonationResult;
  }

  const groupSimulationResult = await resolveGroupSimulation(payload, sessionId);
  return groupSimulationResult ?? buildSessionOnlyContext(sessionInfo.userId);
}

export const getServerUserContext = cache(getServerUserContextImpl);
