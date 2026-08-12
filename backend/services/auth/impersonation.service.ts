import { ImpersonationRepository } from "@/backend/db/repo/auth";
import { SessionRepository } from "@/backend/db/repo/shared";
import { UserRepository } from "@/backend/db/repo/users";
import type { CustomJWTPayload } from "@/backend/lib/auth/jwt";
import { generateAccessToken, generateImpersonationAccessToken } from "@/backend/lib/auth/jwt";
import { hashSessionId } from "@/backend/lib/auth/session-hash";
import { logger } from "@/backend/lib/logger";
import {
  assertSessionOwnership,
  getSimulationExpiresAt,
  writeSimulationAuditLog,
} from "@/backend/services/auth/__shared__/simulationBase";
import { clearOptionalRedisGroupSimulation } from "@/backend/services/auth/permission-group-simulation.service";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type * as Types from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export const IMPERSONATION_TTL_MS = 30 * 60 * 1000;

function omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, key: K): Omit<T, K> {
  const result = { ...obj };
  delete result[key];
  return result;
}

function getExpiresAt(startedAt: Date): Date {
  return getSimulationExpiresAt(startedAt, IMPERSONATION_TTL_MS);
}

async function writeAdminAuditLog(
  actorUserId: string,
  targetUserId: string,
  action: Types.ImpersonationAuditAction,
  metadata: Record<string, unknown>,
  ipAddress?: string | null
): Promise<void> {
  await writeSimulationAuditLog({
    actorUserId,
    targetUserId,
    action,
    description:
      action === "IMPERSONATION_START" ? "Started user impersonation session" : "Ended user impersonation session",
    metadata,
    ipAddress,
  });
}

async function getActiveDbImpersonation(rawSessionId: string, actorUserId: string) {
  const hashedSessionId = hashSessionId(rawSessionId);
  const row = await ImpersonationRepository.findActiveBySessionId(hashedSessionId);
  if (row?.actorUserId !== actorUserId) {
    return null;
  }

  const expiresAt = getExpiresAt(row.startedAt);
  if (expiresAt.getTime() <= Date.now()) {
    await ImpersonationRepository.endById(row.id);
    await clearOptionalRedisImpersonation(rawSessionId);
    return null;
  }

  return { row, expiresAt };
}

async function syncOptionalRedisImpersonation(
  rawSessionId: string,
  impersonation: Types.RedisImpersonationData
): Promise<void> {
  await SessionRepository.updateRedisSessionData(rawSessionId, data => ({
    ...data,
    impersonation,
  }));
}

async function clearOptionalRedisImpersonation(rawSessionId: string): Promise<void> {
  await SessionRepository.updateRedisSessionData(rawSessionId, data => omit(data, "impersonation"));
}

export namespace ImpersonationService {
  export async function assertCanImpersonate(
    actorUserId: string,
    targetUserId: string,
    tErrors: ErrorsLabels
  ): Promise<void> {
    if (actorUserId === targetUserId) {
      throw new Error(tErrors.auth.cannotImpersonateSelf);
    }

    const actorContext = await PermissionsService.getUserContext(actorUserId);
    if (!actorContext.isSuperAdmin) {
      throw new Error(tErrors.auth.impersonationNotAllowed);
    }

    const targetUser = await UserRepository.findById(targetUserId);
    if (!targetUser) {
      throw new Error(tErrors.auth.impersonationTargetNotFound);
    }

    if (targetUser.deletedAt) {
      throw new Error(tErrors.auth.impersonationTargetInactive);
    }

    if (targetUser.status === "DEACTIVATED") {
      throw new Error(tErrors.auth.impersonationTargetInactive);
    }

    if (targetUser.isSuperAdmin) {
      throw new Error(tErrors.auth.cannotImpersonateSuperAdmin);
    }
  }

  export async function startImpersonation(
    input: Types.StartImpersonationInput,
    tErrors: ErrorsLabels
  ): Promise<Types.StartImpersonationReturnType> {
    await assertCanImpersonate(input.actorUserId, input.targetUserId, tErrors);
    await assertSessionOwnership(input.sessionId, input.actorUserId, "impersonationSessionInvalid", tErrors);

    const targetUser = await UserRepository.findById(input.targetUserId);
    if (!targetUser) {
      throw new Error(tErrors.auth.impersonationTargetNotFound);
    }

    const hashedSessionId = hashSessionId(input.sessionId);
    await ImpersonationRepository.endActiveForActor(input.actorUserId);
    await clearOptionalRedisGroupSimulation(input.sessionId);

    const startedAt = new Date();
    const expiresAt = getExpiresAt(startedAt);

    const dbSession = await ImpersonationRepository.createSession({
      ...input,
      sessionId: hashedSessionId,
    });

    await syncOptionalRedisImpersonation(input.sessionId, {
      targetUserId: input.targetUserId,
      startedAt: startedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      reason: input.reason ?? undefined,
      impersonationSessionId: dbSession.id,
    });

    await SessionRepository.updateRedisSessionData(input.sessionId, data => omit(data, "groupSimulation"));

    const impersonationExpiresAt = Math.floor(expiresAt.getTime() / 1000);
    const token = await generateImpersonationAccessToken(
      input.actorUserId,
      input.targetUserId,
      targetUser.email,
      impersonationExpiresAt
    );

    await writeAdminAuditLog(
      input.actorUserId,
      input.targetUserId,
      "IMPERSONATION_START",
      {
        sessionId: hashedSessionId,
        reason: input.reason ?? null,
        impersonationSessionId: dbSession.id,
      },
      input.ipAddress
    );

    logger.info("Impersonation started", {
      actorUserId: input.actorUserId,
      targetUserId: input.targetUserId,
    });

    return {
      token,
      expiresAt,
      impersonationSessionId: dbSession.id,
    };
  }

  export async function endImpersonation(
    actorUserId: string,
    rawSessionId: string,
    tErrors: ErrorsLabels,
    ipAddress?: string | null
  ): Promise<Types.EndImpersonationReturnType> {
    await assertSessionOwnership(rawSessionId, actorUserId, "impersonationSessionInvalid", tErrors);

    const active = await getActiveDbImpersonation(rawSessionId, actorUserId);
    if (!active) {
      throw new Error(tErrors.auth.impersonationNotActive);
    }

    await ImpersonationRepository.endById(active.row.id);
    await clearOptionalRedisImpersonation(rawSessionId);

    const actorUser = await UserRepository.findById(actorUserId);
    if (!actorUser) {
      throw new Error(tErrors.auth.impersonationSessionInvalid);
    }

    const token = await generateAccessToken(actorUser.id, actorUser.email);

    await writeAdminAuditLog(
      actorUserId,
      active.row.targetUserId,
      "IMPERSONATION_END",
      {
        sessionId: hashSessionId(rawSessionId),
        impersonationSessionId: active.row.id,
      },
      ipAddress
    );

    logger.info("Impersonation ended", {
      actorUserId,
      targetUserId: active.row.targetUserId,
    });

    return { token };
  }

  export async function getStatusForSession(
    rawSessionId: string,
    actorUserId: string
  ): Promise<Types.ImpersonationStatusReturnType> {
    const active = await getActiveDbImpersonation(rawSessionId, actorUserId);
    if (!active) {
      return { isActive: false };
    }

    return {
      isActive: true,
      targetUserId: active.row.targetUserId,
      actorUserId,
      startedAt: active.row.startedAt,
      expiresAt: active.expiresAt,
      reason: active.row.reason ?? null,
    };
  }

  export async function clearExpiredImpersonation(rawSessionId: string, actorUserId: string): Promise<void> {
    await getActiveDbImpersonation(rawSessionId, actorUserId);
  }

  export type ResolvedAuthIdentity = {
    effectiveUserId: string;
    actorUserId?: string;
    isImpersonating: boolean;
  };

  export async function resolveAuthIdentityFromToken(
    payload: CustomJWTPayload,
    rawSessionId: string | undefined
  ): Promise<ResolvedAuthIdentity | null> {
    if (!rawSessionId) {
      return { effectiveUserId: payload.userId, isImpersonating: false };
    }

    const session = await SessionRepository.findSessionById(rawSessionId);
    if (!session?.userId) {
      if (!payload.impersonation) {
        return { effectiveUserId: payload.userId, isImpersonating: false };
      }
      return null;
    }

    if (!payload.impersonation || !payload.actorUserId) {
      if (payload.userId !== session.userId) {
        return { effectiveUserId: payload.userId, isImpersonating: false };
      }
      return { effectiveUserId: payload.userId, isImpersonating: false };
    }

    if (payload.actorUserId !== session.userId) {
      return null;
    }

    const active = await getActiveDbImpersonation(rawSessionId, payload.actorUserId);
    if (active?.row.targetUserId !== payload.userId) {
      return null;
    }

    if (payload.impersonationExpiresAt && payload.impersonationExpiresAt * 1000 <= Date.now()) {
      await ImpersonationRepository.endById(active.row.id);
      await clearOptionalRedisImpersonation(rawSessionId);
      return null;
    }

    return {
      effectiveUserId: payload.userId,
      actorUserId: payload.actorUserId,
      isImpersonating: true,
    };
  }

  export async function issueAccessTokenForSession(actorUserId: string, rawSessionId: string): Promise<string | null> {
    const session = await SessionRepository.findSessionById(rawSessionId);
    if (session?.userId !== actorUserId) {
      return null;
    }

    const active = await getActiveDbImpersonation(rawSessionId, actorUserId);
    if (active) {
      const targetUser = await UserRepository.findById(active.row.targetUserId);
      if (targetUser) {
        return await generateImpersonationAccessToken(
          actorUserId,
          active.row.targetUserId,
          targetUser.email,
          Math.floor(active.expiresAt.getTime() / 1000)
        );
      }
    }

    const actorUser = await UserRepository.findById(actorUserId);
    if (!actorUser) return null;
    return await generateAccessToken(actorUser.id, actorUser.email);
  }
}
