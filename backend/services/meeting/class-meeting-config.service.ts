import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { ClassMeetingConfigRepository } from "@/backend/db/repo/meeting/class-meeting-config.repository";
import { MeetingProviderRepository } from "@/backend/db/repo/meeting/meeting-provider.repository";
import { UserMeetingConfigRepository } from "@/backend/db/repo/meeting/user-meeting-config.repository";
import { classInstances, teachers } from "@/backend/db/schema";
import { AppPermission } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { parseMeetingConfigDetails } from "@/backend/lib/meeting-config.validation";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  buildMaskedClassMeetingConfig,
  buildMaskedClassMeetingConfigs,
} from "@/backend/services/meeting/class-meeting-config-mask";
import { MeetingConfigSnapshotService } from "@/backend/services/meeting/meeting-config-snapshot";
import { MeetingProviderCatalogService } from "@/backend/services/meeting/meeting-provider-catalog.service";
import { isMeetingChannelError, maybeGenerateUrl } from "@/backend/services/meeting/utils/maybe-generate-url";
import type {
  ClassMeetingConfigReturnType,
  ClassMeetingConfigSelectType,
  ClassMeetingConfigSubmitInput,
  EffectiveMeetingReturnType,
  UpdateClassMeetingConfigInput,
} from "@/backend/types/meeting/class-meeting-config.types";
import type { MeetingConfigDetails } from "@/backend/types/meeting/meeting-config.types";
import type { MeetingProviderSelectType } from "@/backend/types/meeting/meeting-provider.types";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Wraps `maybeGenerateUrl` with typed error handling for class meeting configs.
 *
 * - `MeetingChannelError` subclasses are logged at `warn` and re-thrown as-is.
 * - Unexpected errors are logged at `error` and re-thrown as a user-friendly error.
 */
async function safeClassMaybeGenerateUrl(
  provider: MeetingProviderSelectType,
  details: MeetingConfigDetails,
  options: {
    readonly topic: string;
    readonly actorUserId?: string;
  },
  friendlyMessage: string
): Promise<{
  details: MeetingConfigDetails;
  providerMetadata: Record<string, unknown> | null;
}> {
  try {
    return await maybeGenerateUrl(provider, details, options);
  } catch (error) {
    if (isMeetingChannelError(error)) {
      logger.warn("safeClassMaybeGenerateUrl: typed adapter error", {
        providerKind: provider.providerKind,
        slug: provider.slug,
        code: error.code,
        message: error.message,
      });
      throw error;
    }
    logger.error("safeClassMaybeGenerateUrl: unexpected error during URL generation", {
      providerKind: provider.providerKind,
      slug: provider.slug,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(friendlyMessage, { cause: error });
  }
}

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

  async function resolveAndMaskConfig(config: ClassMeetingConfigSelectType): Promise<ClassMeetingConfigReturnType> {
    const providerMap = await resolveProvidersForClassConfigs([config]);
    return buildMaskedClassMeetingConfig(config, true, providerMap);
  }

  async function listScopedConfigs(
    actorUserId: string,
    scope: { classInstanceId: string } | { recurringScheduleId: string },
    tErrors: ErrorsLabels
  ): Promise<ClassMeetingConfigReturnType[]> {
    await assertCanManageClass(actorUserId, tErrors);
    const rows = await ClassMeetingConfigRepository.listByScope(scope);
    const providerMap = await resolveProvidersForClassConfigs(rows);
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
    const { details, providerMetadata } = await safeClassMaybeGenerateUrl(
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

      const result = await safeClassMaybeGenerateUrl(
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
    source: "none",
    configId: null,
    providerId: null,
    supportsAutoGeneration: false,
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
      joinUrl: snapshot.details.meetingUrl ?? null,
      providerSlug: snapshot.provider.catalogSlug,
      providerName: snapshot.provider.catalogName,
      logoUrl: snapshot.provider.logoUrl,
      meetingId: snapshot.details.meetingUrl ? extractMeetingId(snapshot.details.meetingUrl) : null,
      source,
      configId: config.id,
      providerId: config.providerId,
      supportsAutoGeneration: snapshot.provider.supportsAutoGeneration,
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
      joinUrl: snapshot.details.meetingUrl ?? null,
      providerSlug: snapshot.provider.catalogSlug,
      providerName: snapshot.provider.catalogName,
      logoUrl: snapshot.provider.logoUrl,
      meetingId: snapshot.details.meetingUrl ? extractMeetingId(snapshot.details.meetingUrl) : null,
      source: "teacher",
      configId: teacherDefault.id,
      providerId: teacherDefault.providerId,
      supportsAutoGeneration: snapshot.provider.supportsAutoGeneration,
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
