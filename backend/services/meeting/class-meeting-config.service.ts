import { eq, inArray } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { db } from "@/backend/db/drizzleDb";
import { ClassMeetingConfigRepository } from "@/backend/db/repo/meeting/class-meeting-config.repository";
import { MeetingProviderRepository } from "@/backend/db/repo/meeting/meeting-provider.repository";
import { UserMeetingConfigRepository } from "@/backend/db/repo/meeting/user-meeting-config.repository";
import { classInstances, teachers } from "@/backend/db/schema";
import { AppPermission, EffectiveMeetingSource } from "@/backend/enum";
import { parseMeetingConfigDetails } from "@/backend/lib/meeting-config.validation";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  resolveProvidersForConfigs,
  safeMaybeGenerateUrl,
} from "@/backend/services/meeting/__shared__/meetingConfigHelpers";
import {
  buildMaskedClassMeetingConfig,
  buildMaskedClassMeetingConfigs,
} from "@/backend/services/meeting/class-meeting-config-mask";
import { buildMeetingProviderCatalogSnapshot } from "@/backend/services/meeting/meeting-config-mask";
import { MeetingConfigSnapshotService } from "@/backend/services/meeting/meeting-config-snapshot";
import type {
  ClassMeetingConfigReturnType,
  ClassMeetingConfigSelectType,
  ClassMeetingConfigSubmitInput,
  DBTransaction,
  EffectiveMeetingReturnType,
  MeetingConfigDetails,
  MeetingProviderSelectType,
  UpdateClassMeetingConfigInput,
  UserMeetingConfigSelectType,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace ClassMeetingConfigService {
  async function assertCanManageClass(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
    const canManage = await PermissionsService.hasPermission(actorUserId, AppPermission.MEETING_CONFIGS_MANAGE_CLASS);
    if (!canManage) {
      throw new Error(tErrors.unauthorizedAction);
    }
  }

  async function resolveAndMaskConfig(config: ClassMeetingConfigSelectType): Promise<ClassMeetingConfigReturnType> {
    const providerMap = await resolveProvidersForConfigs([config]);
    return buildMaskedClassMeetingConfig(config, true, providerMap);
  }

  async function listScopedConfigs(
    actorUserId: string,
    scope: { classInstanceId: string } | { recurringScheduleId: string },
    tErrors: ErrorsLabels
  ): Promise<ClassMeetingConfigReturnType[]> {
    await assertCanManageClass(actorUserId, tErrors);
    const rows = await ClassMeetingConfigRepository.listByScope(scope);
    const providerMap = await resolveProvidersForConfigs(rows);
    return buildMaskedClassMeetingConfigs(rows, true, providerMap);
  }

  export async function listClassMeetingConfigs(
    actorUserId: string,
    classInstanceId: string,
    tErrors: ErrorsLabels
  ): Promise<ClassMeetingConfigReturnType[]> {
    return listScopedConfigs(actorUserId, { classInstanceId }, tErrors);
  }

  export async function listRecurringMeetingConfigs(
    actorUserId: string,
    recurringScheduleId: string,
    tErrors: ErrorsLabels
  ): Promise<ClassMeetingConfigReturnType[]> {
    return listScopedConfigs(actorUserId, { recurringScheduleId }, tErrors);
  }

  async function loadConfigForActor(actorUserId: string, id: string, tErrors: ErrorsLabels) {
    await assertCanManageClass(actorUserId, tErrors);
    const config = await ClassMeetingConfigRepository.getByIdOrThrow(id, tErrors);
    return config;
  }

  export async function getClassMeetingConfig(
    actorUserId: string,
    id: string,
    tErrors: ErrorsLabels
  ): Promise<ClassMeetingConfigReturnType> {
    const config = await loadConfigForActor(actorUserId, id, tErrors);
    return resolveAndMaskConfig(config);
  }

  export async function createClassMeetingConfig(
    actorUserId: string,
    input: ClassMeetingConfigSubmitInput,
    tErrors: ErrorsLabels
  ): Promise<ClassMeetingConfigReturnType> {
    await assertCanManageClass(actorUserId, tErrors);
    const provider = await MeetingProviderRepository.getByIdOrThrow(input.providerId, tErrors);

    if (!provider.isActive) {
      throw new Error(tErrors.meetingProviderInactive);
    }

    const parsedDetails = parseMeetingConfigDetails(provider, input.details);
    const { details, providerMetadata } = await safeMaybeGenerateUrl(
      provider,
      parsedDetails,
      {
        topic: input.label ?? "Class Meeting",
        actorUserId,
      },
      tErrors.meetingProvider.meetingConfigCreateFailed
    );

    const created = await ClassMeetingConfigRepository.create(
      {
        classInstanceId: input.classInstanceId ?? null,
        recurringScheduleId: input.recurringScheduleId ?? null,
        providerId: input.providerId,
        label: input.label ?? null,
        isDefault: input.isDefault,
        details,
        encryptedSecret: input.password ?? null,
        providerMetadata,
      },
      tErrors
    );

    return resolveAndMaskConfig(created);
  }

  export async function updateClassMeetingConfig(
    actorUserId: string,
    id: string,
    input: UpdateClassMeetingConfigInput & { providerId?: string },
    tErrors: ErrorsLabels
  ): Promise<ClassMeetingConfigReturnType> {
    const existing = await loadConfigForActor(actorUserId, id, tErrors);
    const providerId = input.providerId ?? existing.providerId;
    const provider = await MeetingProviderRepository.getByIdOrThrow(providerId, tErrors);

    const detailsChanged = input.details !== undefined;
    const providerChanged = input.providerId !== undefined && input.providerId !== existing.providerId;

    let details: MeetingConfigDetails | undefined;
    let providerMetadata: Record<string, unknown> | null | undefined;

    if (detailsChanged || providerChanged) {
      const inputDetails = input.details ?? existing.details;
      const parsed = parseMeetingConfigDetails(provider, inputDetails);

      const shouldRegenerate = !parsed.meetingUrl && provider.providerKind !== "manual" && detailsChanged;

      const result = await safeMaybeGenerateUrl(
        provider,
        parsed,
        {
          topic: input.label ?? existing.label ?? "Class Meeting",
          actorUserId,
        },
        tErrors.meetingProvider.meetingConfigUpdateFailed
      );
      details = result.details;
      providerMetadata = result.providerMetadata;

      if (!shouldRegenerate && providerMetadata === null && !detailsChanged) {
        providerMetadata = existing.providerMetadata ?? null;
      }
    }

    const updated = await ClassMeetingConfigRepository.update(
      id,
      {
        label: input.label,
        isDefault: input.isDefault,
        details,
        encryptedSecret: input.password === undefined ? undefined : input.password,
        providerId: input.providerId,
        providerMetadata,
      },
      tErrors
    );

    return resolveAndMaskConfig(updated);
  }

  export async function deleteClassMeetingConfig(
    actorUserId: string,
    id: string,
    tErrors: ErrorsLabels
  ): Promise<{ id: string }> {
    await loadConfigForActor(actorUserId, id, tErrors);
    await ClassMeetingConfigRepository.deleteConfig(id, tErrors);
    return { id };
  }

  export async function setDefaultClassMeetingConfig(
    actorUserId: string,
    id: string,
    tErrors: ErrorsLabels
  ): Promise<ClassMeetingConfigReturnType> {
    await loadConfigForActor(actorUserId, id, tErrors);
    const updated = await ClassMeetingConfigRepository.setDefault(id, tErrors);
    return resolveAndMaskConfig(updated);
  }
}

async function getTeacherUserId(teacherId: string, tx?: DBTransaction): Promise<string | null> {
  const client = tx ?? db;
  const [row] = await client
    .select({ userId: teachers.userId })
    .from(teachers)
    .where(eq(teachers.id, teacherId))
    .limit(1);
  return row?.userId ?? null;
}

function extractMeetingId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const lastSegment = parsed.pathname.split("/").findLast(segment => segment !== "");
    return lastSegment ?? null;
  } catch {
    return null;
  }
}

export namespace EffectiveMeetingService {
  const empty: EffectiveMeetingReturnType = {
    joinUrl: null,
    providerSlug: null,
    providerName: null,
    logoUrl: null,
    meetingId: null,
    source: EffectiveMeetingSource.NONE,
    configId: null,
    providerId: null,
    supportsAutoGeneration: false,
  };

  function buildEffectiveFromSnapshot(
    snapshot: Awaited<ReturnType<typeof MeetingConfigSnapshotService.buildClassSessionSnapshot>>,
    source: EffectiveMeetingSource,
    configId: string,
    providerId: string
  ): EffectiveMeetingReturnType {
    return {
      joinUrl: snapshot.details.meetingUrl ?? null,
      providerSlug: snapshot.provider.catalogSlug,
      providerName: snapshot.provider.catalogName,
      logoUrl: snapshot.provider.logoUrl,
      meetingId: snapshot.details.meetingUrl ? extractMeetingId(snapshot.details.meetingUrl) : null,
      source,
      configId,
      providerId,
      supportsAutoGeneration: snapshot.provider.supportsAutoGeneration,
    };
  }

  async function fromClassConfig(
    config: Awaited<ReturnType<typeof ClassMeetingConfigRepository.getDefaultForClassInstance>>,
    source: EffectiveMeetingSource.CLASS | EffectiveMeetingSource.RECURRING,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<EffectiveMeetingReturnType> {
    if (!config) {
      return empty;
    }

    const snapshot = await MeetingConfigSnapshotService.buildClassSessionSnapshot(config.id, tErrors, tx);
    return buildEffectiveFromSnapshot(snapshot, source, config.id, config.providerId);
  }

  async function fromTeacherDefault(
    teacherDefault: Awaited<ReturnType<typeof UserMeetingConfigRepository.getDefaultForUser>>,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<EffectiveMeetingReturnType> {
    if (!teacherDefault) {
      return empty;
    }

    const snapshot = await MeetingConfigSnapshotService.buildSessionSnapshot(teacherDefault.id, tErrors, tx);
    return buildEffectiveFromSnapshot(
      snapshot,
      EffectiveMeetingSource.TEACHER,
      teacherDefault.id,
      teacherDefault.providerId
    );
  }

  async function resolveTeacherDefault(
    userId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<EffectiveMeetingReturnType> {
    const teacherDefault = await UserMeetingConfigRepository.getDefaultForUser(userId, tx);
    return fromTeacherDefault(teacherDefault, tErrors, tx);
  }

  export async function resolveForClassInstances(
    classInstanceIds: readonly string[],
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<Map<string, EffectiveMeetingReturnType>> {
    const resultMap = new Map<string, EffectiveMeetingReturnType>();
    if (classInstanceIds.length === 0) {
      return resultMap;
    }

    const client = queryDb(tx);
    const uniqueIds = Array.from(new Set(classInstanceIds));

    // 1. Fetch class-level default configs in batch
    const classDefaults = await ClassMeetingConfigRepository.getDefaultsForClassInstances(uniqueIds, tx);
    const classDefaultMap = new Map<string, ClassMeetingConfigSelectType>();
    for (const config of classDefaults) {
      if (config.classInstanceId) {
        classDefaultMap.set(config.classInstanceId, config);
      }
    }

    // Identify instances missing class-level default
    const missingClassDefaultIds = uniqueIds.filter(id => !classDefaultMap.has(id));

    // 2. Fetch class instance metadata (recurringScheduleId, teacherId) for missing instances
    const instanceMetaMap = new Map<string, { recurringScheduleId: string | null; teacherId: string }>();
    if (missingClassDefaultIds.length > 0) {
      const rows = await client
        .select({
          id: classInstances.id,
          recurringScheduleId: classInstances.recurringScheduleId,
          teacherId: classInstances.teacherId,
        })
        .from(classInstances)
        .where(inArray(classInstances.id, missingClassDefaultIds));

      for (const row of rows) {
        instanceMetaMap.set(row.id, {
          recurringScheduleId: row.recurringScheduleId,
          teacherId: row.teacherId,
        });
      }
    }

    // 3. Fetch recurring schedule defaults for missing instances
    const recurringScheduleIds = Array.from(
      new Set(
        Array.from(instanceMetaMap.values())
          .map(meta => meta.recurringScheduleId)
          .filter((id): id is string => Boolean(id))
      )
    );

    const recurringDefaultMap = new Map<string, ClassMeetingConfigSelectType>();
    if (recurringScheduleIds.length > 0) {
      const recurringDefaults = await ClassMeetingConfigRepository.getDefaultsForRecurringSchedules(
        recurringScheduleIds,
        tx
      );
      for (const config of recurringDefaults) {
        if (config.recurringScheduleId) {
          recurringDefaultMap.set(config.recurringScheduleId, config);
        }
      }
    }

    // 4. For instances still unresolved, resolve teacher defaults
    const teacherIdsNeeded = Array.from(
      new Set(
        missingClassDefaultIds
          .map(id => instanceMetaMap.get(id))
          .filter(meta => meta && (!meta.recurringScheduleId || !recurringDefaultMap.has(meta.recurringScheduleId)))
          .map(meta => meta?.teacherId)
          .filter((id): id is string => Boolean(id))
      )
    );

    const teacherUserMap = new Map<string, string>();
    const teacherDefaultMap = new Map<string, UserMeetingConfigSelectType>();

    if (teacherIdsNeeded.length > 0) {
      const teacherRows = await client
        .select({ id: teachers.id, userId: teachers.userId })
        .from(teachers)
        .where(inArray(teachers.id, teacherIdsNeeded));

      for (const row of teacherRows) {
        teacherUserMap.set(row.id, row.userId);
      }

      const userIds = Array.from(new Set(Array.from(teacherUserMap.values())));
      if (userIds.length > 0) {
        const userDefaults = await UserMeetingConfigRepository.getDefaultsForUsers(userIds, tx);
        for (const config of userDefaults) {
          teacherDefaultMap.set(config.userId, config);
        }
      }
    }

    // 5. Gather all providerIds referenced by any resolved config
    const providerIds = new Set<string>();
    for (const config of classDefaultMap.values()) providerIds.add(config.providerId);
    for (const config of recurringDefaultMap.values()) providerIds.add(config.providerId);
    for (const config of teacherDefaultMap.values()) providerIds.add(config.providerId);

    const providerMap = new Map<string, MeetingProviderSelectType>();
    if (providerIds.size > 0) {
      const providers = await MeetingProviderRepository.getByIds(Array.from(providerIds), tx);
      for (const provider of providers) {
        providerMap.set(provider.id, provider);
      }
    }

    // Helper to build EffectiveMeetingReturnType synchronously
    const buildEffective = (
      config: ClassMeetingConfigSelectType | UserMeetingConfigSelectType,
      source: EffectiveMeetingSource
    ): EffectiveMeetingReturnType => {
      const provider = providerMap.get(config.providerId);
      if (!provider) return empty;

      const details = parseMeetingConfigDetails(provider, config.details);
      const snapshot = {
        userMeetingConfigId: config.id,
        providerId: config.providerId,
        label: config.label,
        details,
        provider: buildMeetingProviderCatalogSnapshot(provider),
        snapshottedAt: new Date().toISOString(),
      };
      return buildEffectiveFromSnapshot(snapshot, source, config.id, config.providerId);
    };

    // 6. Build effective meeting for each class instance ID
    for (const id of classInstanceIds) {
      const classDefault = classDefaultMap.get(id);
      if (classDefault) {
        resultMap.set(id, buildEffective(classDefault, EffectiveMeetingSource.CLASS));
        continue;
      }

      const meta = instanceMetaMap.get(id);
      if (!meta) {
        resultMap.set(id, empty);
        continue;
      }

      if (meta.recurringScheduleId) {
        const recurringDefault = recurringDefaultMap.get(meta.recurringScheduleId);
        if (recurringDefault) {
          resultMap.set(id, buildEffective(recurringDefault, EffectiveMeetingSource.RECURRING));
          continue;
        }
      }

      const teacherUserId = teacherUserMap.get(meta.teacherId);
      if (teacherUserId) {
        const teacherDefault = teacherDefaultMap.get(teacherUserId);
        if (teacherDefault) {
          resultMap.set(id, buildEffective(teacherDefault, EffectiveMeetingSource.TEACHER));
          continue;
        }
      }

      resultMap.set(id, empty);
    }

    return resultMap;
  }

  export async function resolveForClassInstance(
    classInstanceId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<EffectiveMeetingReturnType> {
    const map = await resolveForClassInstances([classInstanceId], tErrors, tx);
    return map.get(classInstanceId) ?? empty;
  }

  export async function resolveForRecurringSchedule(
    recurringScheduleId: string,
    teacherId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<EffectiveMeetingReturnType> {
    const recurringDefault = await ClassMeetingConfigRepository.getDefaultForRecurringSchedule(recurringScheduleId, tx);
    if (recurringDefault) {
      return fromClassConfig(recurringDefault, EffectiveMeetingSource.RECURRING, tErrors, tx);
    }

    const userId = await getTeacherUserId(teacherId, tx);
    if (!userId) {
      return empty;
    }

    return resolveTeacherDefault(userId, tErrors, tx);
  }

  export async function resolveForNewBooking(
    teacherId: string,
    options: {
      readonly recurringScheduleId?: string | null;
      readonly tErrors: ErrorsLabels;
      readonly tx?: DBTransaction;
    }
  ): Promise<EffectiveMeetingReturnType> {
    const { recurringScheduleId, tErrors, tx } = options;

    if (recurringScheduleId) {
      return resolveForRecurringSchedule(recurringScheduleId, teacherId, tErrors, tx);
    }

    const userId = await getTeacherUserId(teacherId, tx);
    if (userId) {
      return resolveTeacherDefault(userId, tErrors, tx);
    }

    return empty;
  }
}
