import { eq, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { ImpersonationRepository, SessionRepository, UserRepository } from "@/backend/db/repo";
import { localeJsonKey, resolveLocalized } from "@/backend/db/repo/utils/resolve-localized";
import { adminAuditLogs, permissionGroups } from "@/backend/db/schema";
import { SystemPermissionGroupSlug } from "@/backend/enum";
import type { CustomJWTPayload } from "@/backend/lib/auth/jwt";
import { generateAccessToken, generateGroupSimulationAccessToken } from "@/backend/lib/auth/jwt";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type * as Types from "@/backend/types";
import type { RedisGroupSimulationSessionData } from "@/backend/types/auth/auth.types";
import type { ErrorsLabels } from "@/shared/locale";
import { DEFAULT_CONTENT_LOCALE } from "@/shared/types";

export const GROUP_SIMULATION_TTL_MS = 30 * 60 * 1000;

const NON_SIMULATABLE_GROUP_SLUGS = new Set<string>(["system_automated"]);

const IPV4_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

function sanitizeIpAddress(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const parts = ip.split(":");
  const cleanIp = parts.length === 2 ? parts[0] : ip;
  return IPV4_REGEX.test(cleanIp) ? cleanIp : "127.0.0.1";
}

function getExpiresAt(startedAt: Date): Date {
  return new Date(startedAt.getTime() + GROUP_SIMULATION_TTL_MS);
}

async function writeAdminAuditLog(
  actorUserId: string,
  action: Types.GroupSimulationAuditAction,
  metadata: Record<string, unknown>,
  ipAddress?: string | null
): Promise<void> {
  await db.insert(adminAuditLogs).values({
    actorUserId,
    targetUserId: actorUserId,
    action,
    description:
      action === "GROUP_SIMULATION_START" ? "Started permission group simulation" : "Ended permission group simulation",
    newState: metadata,
    ipAddress: sanitizeIpAddress(ipAddress),
    createdAt: new Date(),
  });
}

async function assertActorOwnsSession(rawSessionId: string, actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
  const session = await SessionRepository.findSessionById(rawSessionId);
  if (session?.userId !== actorUserId) {
    throw new Error(tErrors.auth.groupSimulationSessionInvalid);
  }
}

async function getActiveGroupSimulation(
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

async function syncGroupSimulation(
  rawSessionId: string,
  groupSimulation: RedisGroupSimulationSessionData
): Promise<void> {
  await SessionRepository.setSessionGroupSimulation(rawSessionId, groupSimulation);
}

export async function clearOptionalRedisGroupSimulation(rawSessionId: string): Promise<void> {
  await SessionRepository.clearSessionGroupSimulation(rawSessionId);
}

export namespace PermissionGroupSimulationService {
  async function getOwnedGroupSlugs(actorUserId: string): Promise<Set<string>> {
    const actorContext = await PermissionsService.getUserContext(actorUserId);
    if (actorContext.isSuperAdmin) {
      return new Set([SystemPermissionGroupSlug.SUPER_ADMIN]);
    }
    return new Set(actorContext.permissionGroups);
  }

  export async function listSimulatableGroups(
    actorUserId: string,
    locale?: string
  ): Promise<Types.SimulatablePermissionGroupReturnType[]> {
    const actorContext = await PermissionsService.getUserContext(actorUserId);
    const key = localeJsonKey(locale);

    const groups = await db
      .select({
        slug: permissionGroups.slug,
        name: permissionGroups.name,
        description: permissionGroups.description,
      })
      .from(permissionGroups)
      .orderBy(sql`coalesce(${permissionGroups.name}->>${key}, ${permissionGroups.name}->>${DEFAULT_CONTENT_LOCALE})`);

    const excludedSlugs = new Set(NON_SIMULATABLE_GROUP_SLUGS);
    if (actorContext.isSuperAdmin) {
      excludedSlugs.add(SystemPermissionGroupSlug.SUPER_ADMIN);
    } else {
      for (const slug of actorContext.permissionGroups) {
        excludedSlugs.add(slug);
      }
    }

    return groups
      .filter(group => !excludedSlugs.has(group.slug))
      .map(group => {
        const description = resolveLocalized(group.description, locale);
        return {
          slug: group.slug,
          name: resolveLocalized(group.name, locale),
          description: description === "" ? null : description,
        };
      });
  }

  export async function assertCanSimulateGroup(
    actorUserId: string,
    groupSlug: string,
    tErrors: ErrorsLabels
  ): Promise<void> {
    const actorContext = await PermissionsService.getUserContext(actorUserId);
    if (!actorContext.isSuperAdmin) {
      throw new Error(tErrors.auth.groupSimulationNotAllowed);
    }

    const ownedSlugs = await getOwnedGroupSlugs(actorUserId);
    if (ownedSlugs.has(groupSlug)) {
      throw new Error(tErrors.auth.groupSimulationAlreadyHasGroup);
    }

    await PermissionsService.getPermissionGroupContext(groupSlug);
  }

  export async function startSimulation(
    input: Types.StartPermissionGroupSimulationInput,
    tErrors: ErrorsLabels
  ): Promise<Types.StartPermissionGroupSimulationReturnType> {
    await assertCanSimulateGroup(input.actorUserId, input.groupSlug, tErrors);
    await assertActorOwnsSession(input.sessionId, input.actorUserId, tErrors);

    const actorUser = await UserRepository.findById(input.actorUserId);
    if (!actorUser) {
      throw new Error(tErrors.auth.groupSimulationSessionInvalid);
    }

    await ImpersonationRepository.endActiveForActor(input.actorUserId);
    await clearOptionalRedisImpersonation(input.sessionId);

    const startedAt = new Date();
    const expiresAt = getExpiresAt(startedAt);

    await syncGroupSimulation(input.sessionId, {
      groupSlug: input.groupSlug,
      startedAt: startedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    const groupSimulationExpiresAt = Math.floor(expiresAt.getTime() / 1000);
    const token = await generateGroupSimulationAccessToken(
      input.actorUserId,
      actorUser.email,
      input.groupSlug,
      groupSimulationExpiresAt
    );

    await writeAdminAuditLog(
      input.actorUserId,
      "GROUP_SIMULATION_START",
      { groupSlug: input.groupSlug },
      input.ipAddress
    );

    logger.info("Permission group simulation started", {
      actorUserId: input.actorUserId,
      groupSlug: input.groupSlug,
    });

    return {
      token,
      expiresAt,
      groupSlug: input.groupSlug,
    };
  }

  export async function endSimulation(
    actorUserId: string,
    rawSessionId: string,
    tErrors: ErrorsLabels,
    ipAddress?: string | null,
    activeGroupSlug?: string | null
  ): Promise<Types.EndPermissionGroupSimulationReturnType> {
    await assertActorOwnsSession(rawSessionId, actorUserId, tErrors);

    const active = await getActiveGroupSimulation(rawSessionId, actorUserId);
    const groupSlug = active?.data.groupSlug ?? activeGroupSlug ?? undefined;

    if (!groupSlug) {
      throw new Error(tErrors.auth.groupSimulationNotActive);
    }

    await clearOptionalRedisGroupSimulation(rawSessionId);

    const actorUser = await UserRepository.findById(actorUserId);
    if (!actorUser) {
      throw new Error(tErrors.auth.groupSimulationSessionInvalid);
    }

    const token = await generateAccessToken(actorUser.id, actorUser.email);

    await writeAdminAuditLog(actorUserId, "GROUP_SIMULATION_END", { groupSlug }, ipAddress);

    logger.info("Permission group simulation ended", {
      actorUserId,
      groupSlug,
    });

    return { token };
  }

  export async function getStatusForSession(
    rawSessionId: string,
    actorUserId: string,
    fallback?: { groupSlug?: string; startedAt?: Date; expiresAt?: Date },
    locale?: string
  ): Promise<Types.PermissionGroupSimulationStatusReturnType> {
    const active = await getActiveGroupSimulation(rawSessionId, actorUserId);
    if (!active) {
      if (fallback?.groupSlug) {
        const [group] = await db
          .select({ name: permissionGroups.name })
          .from(permissionGroups)
          .where(eq(permissionGroups.slug, fallback.groupSlug))
          .limit(1);

        return {
          isActive: true,
          groupSlug: fallback.groupSlug,
          groupName: group?.name ? resolveLocalized(group.name, locale) : undefined,
          startedAt: fallback.startedAt,
          expiresAt: fallback.expiresAt,
        };
      }

      return { isActive: false };
    }

    const [group] = await db
      .select({ name: permissionGroups.name })
      .from(permissionGroups)
      .where(eq(permissionGroups.slug, active.data.groupSlug))
      .limit(1);

    return {
      isActive: true,
      groupSlug: active.data.groupSlug,
      groupName: group?.name ? resolveLocalized(group.name, locale) : undefined,
      startedAt: new Date(active.data.startedAt),
      expiresAt: active.expiresAt,
    };
  }

  export type ResolvedGroupSimulation = {
    realUserId: string;
    isSimulatingGroup: boolean;
    simulatedGroupSlug?: string;
  };

  export async function resolveGroupSimulationFromToken(
    payload: CustomJWTPayload,
    rawSessionId: string | undefined
  ): Promise<ResolvedGroupSimulation | null> {
    if (payload.impersonation) {
      return null;
    }

    const resolveActiveSessionSimulation = async (
      actorUserId: string,
      sessionId: string
    ): Promise<ResolvedGroupSimulation | null> => {
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
    };

    const hasActiveGroupSimulation = payload.groupSimulation && payload.groupSimulationSlug;
    const noSimulationResult = (): ResolvedGroupSimulation => ({
      realUserId: payload.userId,
      isSimulatingGroup: false,
    });

    const rejectSimWithGroupSession = (): ResolvedGroupSimulation | null =>
      hasActiveGroupSimulation ? null : noSimulationResult();

    if (!rawSessionId) {
      return rejectSimWithGroupSession();
    }

    const session = await SessionRepository.findSessionById(rawSessionId);
    if (!session?.userId) {
      return rejectSimWithGroupSession();
    }
    if (session.userId !== payload.userId) {
      return rejectSimWithGroupSession();
    }

    if (!payload.groupSimulation || !payload.groupSimulationSlug) {
      const fromSession = await resolveActiveSessionSimulation(payload.userId, rawSessionId);
      return fromSession ?? noSimulationResult();
    }

    if (payload.groupSimulationExpiresAt && payload.groupSimulationExpiresAt * 1000 <= Date.now()) {
      await clearOptionalRedisGroupSimulation(rawSessionId);
      return null;
    }

    const serverActive = await getActiveGroupSimulation(rawSessionId, payload.userId);
    if (serverActive?.data.groupSlug !== payload.groupSimulationSlug) {
      const fromSession = await resolveActiveSessionSimulation(payload.userId, rawSessionId);
      return fromSession ?? null;
    }

    try {
      await PermissionsService.getPermissionGroupContext(payload.groupSimulationSlug);
    } catch {
      return null;
    }

    return {
      realUserId: payload.userId,
      isSimulatingGroup: true,
      simulatedGroupSlug: payload.groupSimulationSlug,
    };
  }

  export async function issueAccessTokenForSession(actorUserId: string, rawSessionId: string): Promise<string | null> {
    const session = await SessionRepository.findSessionById(rawSessionId);
    if (session?.userId !== actorUserId) {
      return null;
    }

    const active = await getActiveGroupSimulation(rawSessionId, actorUserId);
    if (active) {
      const actorUser = await UserRepository.findById(actorUserId);
      if (actorUser) {
        return await generateGroupSimulationAccessToken(
          actorUserId,
          actorUser.email,
          active.data.groupSlug,
          Math.floor(active.expiresAt.getTime() / 1000)
        );
      }
    }

    return null;
  }
}

async function clearOptionalRedisImpersonation(rawSessionId: string): Promise<void> {
  await SessionRepository.updateRedisSessionData(rawSessionId, data => {
    const rest = { ...data };
    delete rest.impersonation;
    return rest;
  });
}
