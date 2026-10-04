import { SessionRepository } from "@/backend/db/repo/shared";
import { getSimulationExpiresAt, writeSimulationAuditLog } from "@/backend/services/auth/__shared__/simulationBase";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type * as Types from "@/backend/types";
import type { RedisGroupSimulationSessionData } from "@/backend/types";

const GROUP_SIMULATION_TTL_MS = 30 * 60 * 1000;

export type ResolvedGroupSimulation = {
  realUserId: string;
  isSimulatingGroup: boolean;
  simulatedGroupSlug?: string;
};

export function getExpiresAt(startedAt: Date): Date {
  return getSimulationExpiresAt(startedAt, GROUP_SIMULATION_TTL_MS);
}

export async function writeGroupSimulationAuditLog(
  actorUserId: string,
  action: Types.GroupSimulationAuditAction,
  metadata: Record<string, unknown>,
  ipAddress?: string | null
): Promise<void> {
  await writeSimulationAuditLog({
    actorUserId,
    targetUserId: actorUserId,
    action,
    description:
      action === "GROUP_SIMULATION_START" ? "Started permission group simulation" : "Ended permission group simulation",
    metadata,
    ipAddress,
  });
}

export async function getActiveGroupSimulation(
  rawSessionId: string,
  actorUserId: string
): Promise<{ data: RedisGroupSimulationSessionData; expiresAt: Date } | null> {
  const active = await SessionRepository.getSessionGroupSimulation(rawSessionId, actorUserId);
  if (!active) {
    return null;
  }

  if (active.expiresAt.getTime() <= Date.now()) {
    await SessionRepository.clearSessionGroupSimulation(rawSessionId);
    return null;
  }

  return active;
}

export async function syncGroupSimulation(
  rawSessionId: string,
  groupSimulation: RedisGroupSimulationSessionData
): Promise<void> {
  await SessionRepository.setSessionGroupSimulation(rawSessionId, groupSimulation);
}

export async function resolveActiveSessionSimulation(
  actorUserId: string,
  sessionId: string
): Promise<ResolvedGroupSimulation | null> {
  const serverActive = await getActiveGroupSimulation(sessionId, actorUserId);
  if (!serverActive) {
    return null;
  }

  try {
    await PermissionsService.getPermissionGroupContext(serverActive.data.groupSlug);
  } catch {
    return null;
  }

  return {
    realUserId: actorUserId,
    isSimulatingGroup: true,
    simulatedGroupSlug: serverActive.data.groupSlug,
  };
}
