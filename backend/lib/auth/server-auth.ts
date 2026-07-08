import { cookies } from "next/headers";
import { cache } from "react";
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

async function validateSessionAndToken(sessionId: string, token: string): Promise<{ userId: string } | null> {
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

  const payload = await verifyToken(token);
  if (payload?.type !== "access") {
    logger.info("[AuthRedirect] getServerUserContext: access token invalid or wrong type", {
      tokenType: payload?.type ?? null,
    });
    return null;
  }

  return { userId: session.userId };
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

async function getServerUserContextImpl(): Promise<ServerUserContextResult> {
  const { sessionId, token } = await getSessionCookies();

  if (!sessionId || !token) {
    logger.info("[AuthRedirect] getServerUserContext: no session cookies", {
      hasSessionId: Boolean(sessionId),
      hasAccessToken: Boolean(token),
    });
    return emptyContextResult();
  }

  const sessionInfo = await validateSessionAndToken(sessionId, token);
  if (!sessionInfo) {
    return emptyContextResult();
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return emptyContextResult();
  }

  const impersonationResult = await resolveImpersonation(payload, sessionId);
  if (impersonationResult !== null) {
    return impersonationResult;
  }

  const groupSimulationResult = await resolveGroupSimulation(payload, sessionId);
  return groupSimulationResult ?? emptyContextResult();
}

export const getServerUserContext = cache(getServerUserContextImpl);
