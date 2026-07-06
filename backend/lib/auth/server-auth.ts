import { cookies } from "next/headers";
import { verifyToken } from "@/backend/lib/auth/jwt";
import { logger } from "@/backend/lib/logger";
import { ImpersonationService } from "@/backend/services/auth/impersonation.service";
import { PermissionGroupSimulationService } from "@/backend/services/auth/permission-group-simulation.service";
import { PermissionsService, type UserPermissionContext } from "@/backend/services/auth/permissions.service";
import { SessionService } from "@/backend/services/auth/session.service";

export async function getServerUserContext(): Promise<{
  userId: string | null;
  actorUserId?: string;
  isImpersonating: boolean;
  isSimulatingGroup: boolean;
  simulatedGroupSlug?: string;
  context: UserPermissionContext | null;
}> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  const token = cookieStore.get("access_token")?.value;

  if (!sessionId || !token) {
    logger.info("[AuthRedirect] getServerUserContext: no session cookies", {
      hasSessionId: Boolean(sessionId),
      hasAccessToken: Boolean(token),
    });
    return { userId: null, isImpersonating: false, isSimulatingGroup: false, context: null };
  }

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
    return { userId: null, isImpersonating: false, isSimulatingGroup: false, context: null };
  }

  const payload = await verifyToken(token);
  if (payload?.type !== "access") {
    logger.info("[AuthRedirect] getServerUserContext: access token invalid or wrong type", {
      tokenType: payload?.type ?? null,
    });
    return { userId: null, isImpersonating: false, isSimulatingGroup: false, context: null };
  }

  const impersonationIdentity = await ImpersonationService.resolveAuthIdentityFromToken(payload, sessionId);
  if (!impersonationIdentity) {
    logger.info("[AuthRedirect] getServerUserContext: impersonation identity resolution failed");
    return { userId: null, isImpersonating: false, isSimulatingGroup: false, context: null };
  }

  if (impersonationIdentity.isImpersonating) {
    const context = await PermissionsService.getUserContext(impersonationIdentity.effectiveUserId);
    return {
      userId: impersonationIdentity.effectiveUserId,
      actorUserId: impersonationIdentity.actorUserId,
      isImpersonating: true,
      isSimulatingGroup: false,
      context,
    };
  }

  const groupSimulationIdentity = await PermissionGroupSimulationService.resolveGroupSimulationFromToken(
    payload,
    sessionId
  );
  if (!groupSimulationIdentity) {
    logger.info("[AuthRedirect] getServerUserContext: group simulation identity resolution failed");
    return { userId: null, isImpersonating: false, isSimulatingGroup: false, context: null };
  }

  const context =
    groupSimulationIdentity.isSimulatingGroup && groupSimulationIdentity.simulatedGroupSlug
      ? await PermissionsService.getPermissionGroupContext(groupSimulationIdentity.simulatedGroupSlug)
      : await PermissionsService.getUserContext(groupSimulationIdentity.realUserId);

  return {
    userId: groupSimulationIdentity.realUserId,
    isImpersonating: false,
    isSimulatingGroup: groupSimulationIdentity.isSimulatingGroup,
    simulatedGroupSlug: groupSimulationIdentity.simulatedGroupSlug,
    context,
  };
}
