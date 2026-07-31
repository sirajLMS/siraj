import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { ClassMeetingConfigRepository } from "@/backend/db/repo/meeting/class-meeting-config.repository";
import { MeetingProviderRepository } from "@/backend/db/repo/meeting/meeting-provider.repository";
import { UserMeetingConfigRepository } from "@/backend/db/repo/meeting/user-meeting-config.repository";
import { classInstances, teachers } from "@/backend/db/schema";
import { AppPermission } from "@/backend/enum";
import { parseMeetingConfigDetails } from "@/backend/lib/meeting-config.validation";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  buildMaskedClassMeetingConfig,
  buildMaskedClassMeetingConfigs,
} from "@/backend/services/meeting/class-meeting-config-mask";
import { MeetingConfigSnapshotService } from "@/backend/services/meeting/meeting-config-snapshot";
import { MeetingProviderCatalogService } from "@/backend/services/meeting/meeting-provider-catalog.service";
import type {
  ClassMeetingConfigReturnType,
  ClassMeetingConfigSelectType,
  ClassMeetingConfigSubmitInput,
  EffectiveMeetingReturnType,
  UpdateClassMeetingConfigInput,
} from "@/backend/types/meeting/class-meeting-config.types";
import type { MeetingProviderSelectType } from "@/backend/types/meeting/meeting-provider.types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace ClassMeetingConfigService {
  async function assertCanManageClass(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
    const canManage = await PermissionsService.hasPermission(actorUserId, AppPermission.MEETING_CONFIGS_MANAGE_CLASS);
    if (!canManage) {
      throw new Error(tErrors.unauthorizedAction);
    }
  }

  async function resolveProvidersForClassConfigs(
    configs: ClassMeetingConfigSelectType[]
  ): Promise<Map<string, MeetingProviderSelectType>> {
    const ids = [...new Set(configs.map(c => c.providerId))];
    return MeetingProviderCatalogService.getProvidersByIds(ids);
  }

  export async function listClassMeetingConfigs(
    actorUserId: string,
    classInstanceId: string,
    tErrors: ErrorsLabels
  ): Promise<ClassMeetingConfigReturnType[]> {
    await assertCanManageClass(actorUserId, tErrors);
    const rows = await ClassMeetingConfigRepository.listByScope({ classInstanceId });
    const providerMap = await resolveProvidersForClassConfigs(rows);
    return buildMaskedClassMeetingConfigs(rows, true, providerMap);
  }

  export async function listRecurringMeetingConfigs(
    actorUserId: string,
    recurringScheduleId: string,
    tErrors: ErrorsLabels
  ): Promise<ClassMeetingConfigReturnType[]> {
    await assertCanManageClass(actorUserId, tErrors);
    const rows = await ClassMeetingConfigRepository.listByScope({ recurringScheduleId });
    const providerMap = await resolveProvidersForClassConfigs(rows);
    return buildMaskedClassMeetingConfigs(rows, true, providerMap);
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
    const providerMap = await resolveProvidersForClassConfigs([config]);
    return buildMaskedClassMeetingConfig(config, true, providerMap);
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

    const details = parseMeetingConfigDetails(provider, input.details);

    const created = await ClassMeetingConfigRepository.create(
      {
        classInstanceId: input.classInstanceId ?? null,
        recurringScheduleId: input.recurringScheduleId ?? null,
        providerId: input.providerId,
        label: input.label ?? null,
        isDefault: input.isDefault,
        details,
        encryptedSecret: input.password ?? null,
      },
      tErrors
    );

    const providerMap = await resolveProvidersForClassConfigs([created]);
    return buildMaskedClassMeetingConfig(created, true, providerMap);
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

    const details = input.details === undefined ? undefined : parseMeetingConfigDetails(provider, input.details);

    const updated = await ClassMeetingConfigRepository.update(
      id,
      {
        label: input.label,
        isDefault: input.isDefault,
        details,
        encryptedSecret: input.password === undefined ? undefined : input.password,
        providerId: input.providerId,
      },
      tErrors
    );

    const providerMap = await resolveProvidersForClassConfigs([updated]);
    return buildMaskedClassMeetingConfig(updated, true, providerMap);
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
    const providerMap = await resolveProvidersForClassConfigs([updated]);
    return buildMaskedClassMeetingConfig(updated, true, providerMap);
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
    source: "none",
    configId: null,
    providerId: null,
  };

  async function fromClassConfig(
    config: Awaited<ReturnType<typeof ClassMeetingConfigRepository.getDefaultForClassInstance>>,
    source: "class" | "recurring",
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<EffectiveMeetingReturnType> {
    if (!config) {
      return empty;
    }

    const snapshot = await MeetingConfigSnapshotService.buildClassSessionSnapshot(config.id, tErrors, tx);
    return {
      joinUrl: snapshot.details.meetingUrl,
      providerSlug: snapshot.provider.catalogSlug,
      providerName: snapshot.provider.catalogName,
      logoUrl: snapshot.provider.logoUrl,
      meetingId: extractMeetingId(snapshot.details.meetingUrl),
      source,
      configId: config.id,
      providerId: config.providerId,
    };
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
    return {
      joinUrl: snapshot.details.meetingUrl,
      providerSlug: snapshot.provider.catalogSlug,
      providerName: snapshot.provider.catalogName,
      logoUrl: snapshot.provider.logoUrl,
      meetingId: extractMeetingId(snapshot.details.meetingUrl),
      source: "teacher",
      configId: teacherDefault.id,
      providerId: teacherDefault.providerId,
    };
  }

  async function resolveTeacherDefault(
    userId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<EffectiveMeetingReturnType> {
    const teacherDefault = await UserMeetingConfigRepository.getDefaultForUser(userId, tx);
    return fromTeacherDefault(teacherDefault, tErrors, tx);
  }

  export async function resolveForClassInstance(
    classInstanceId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<EffectiveMeetingReturnType> {
    const client = tx ?? db;
    const classDefault = await ClassMeetingConfigRepository.getDefaultForClassInstance(classInstanceId, tx);
    if (classDefault) {
      return fromClassConfig(classDefault, "class", tErrors, tx);
    }

    const [instance] = await client
      .select({
        recurringScheduleId: classInstances.recurringScheduleId,
        teacherId: classInstances.teacherId,
      })
      .from(classInstances)
      .where(eq(classInstances.id, classInstanceId))
      .limit(1);

    if (!instance) {
      return empty;
    }

    if (instance.recurringScheduleId) {
      const recurringDefault = await ClassMeetingConfigRepository.getDefaultForRecurringSchedule(
        instance.recurringScheduleId,
        tx
      );
      if (recurringDefault) {
        return fromClassConfig(recurringDefault, "recurring", tErrors, tx);
      }
    }

    const userId = await getTeacherUserId(instance.teacherId, tx);
    if (userId) {
      return resolveTeacherDefault(userId, tErrors, tx);
    }

    return empty;
  }

  export async function resolveForRecurringSchedule(
    recurringScheduleId: string,
    teacherId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<EffectiveMeetingReturnType> {
    const recurringDefault = await ClassMeetingConfigRepository.getDefaultForRecurringSchedule(recurringScheduleId, tx);
    if (recurringDefault) {
      return fromClassConfig(recurringDefault, "recurring", tErrors, tx);
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
