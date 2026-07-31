import type { DBTransaction } from "@/backend/db/db.types";
import { ClassMeetingConfigRepository } from "@/backend/db/repo/meeting/class-meeting-config.repository";
import { MeetingProviderRepository } from "@/backend/db/repo/meeting/meeting-provider.repository";
import { UserMeetingConfigRepository } from "@/backend/db/repo/meeting/user-meeting-config.repository";
import { AppPermission } from "@/backend/enum";
import { parseMeetingConfigDetails } from "@/backend/lib/meeting-config.validation";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { buildMaskedMeetingConfig, buildMaskedMeetingConfigs } from "@/backend/services/meeting/meeting-config-mask";
import { MeetingProviderCatalogService } from "@/backend/services/meeting/meeting-provider-catalog.service";
import type {
  ClassMeetingConfigInsertType,
  ClassMeetingConfigSelectType,
} from "@/backend/types/meeting/class-meeting-config.types";
import type {
  UpdateUserMeetingConfigInput,
  UserMeetingConfigReturnType,
  UserMeetingConfigSelectType,
  UserMeetingConfigSubmitInput,
} from "@/backend/types/meeting/meeting-config.types";
import type { MeetingProviderSelectType } from "@/backend/types/meeting/meeting-provider.types";
import type { ErrorsLabels } from "@/shared/locale";

async function resolveProvidersForConfigs(
  configs: UserMeetingConfigSelectType[]
): Promise<Map<string, MeetingProviderSelectType>> {
  const ids = [...new Set(configs.map(c => c.providerId))];
  return MeetingProviderCatalogService.getProvidersByIds(ids);
}

export namespace MeetingConfigService {
  async function assertCanManageUser(
    actorUserId: string,
    targetUserId: string,
    tErrors: ErrorsLabels
  ): Promise<{ isAdminScope: boolean }> {
    if (actorUserId === targetUserId) {
      const canManageOwn = await PermissionsService.hasPermission(
        actorUserId,
        AppPermission.MEETING_CONFIGS_MANAGE_OWN
      );
      if (!canManageOwn) {
        throw new Error(tErrors.unauthorizedAction);
      }
      return { isAdminScope: false };
    }

    const canManageOther = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.MEETING_CONFIGS_MANAGE_OTHER
    );
    if (!canManageOther) {
      throw new Error(tErrors.unauthorizedAction);
    }
    return { isAdminScope: true };
  }

  async function assertCanAccessConfig(
    actorUserId: string,
    configUserId: string,
    tErrors: ErrorsLabels
  ): Promise<{ isAdminScope: boolean }> {
    return assertCanManageUser(actorUserId, configUserId, tErrors);
  }

  export async function listUserMeetingConfigs(
    actorUserId: string,
    userId: string,
    tErrors: ErrorsLabels
  ): Promise<UserMeetingConfigReturnType[]> {
    const { isAdminScope } = await assertCanManageUser(actorUserId, userId, tErrors);
    const rows = await UserMeetingConfigRepository.listByUserId(userId);
    const providerMap = await resolveProvidersForConfigs(rows);
    return buildMaskedMeetingConfigs(rows, isAdminScope, providerMap);
  }

  async function loadConfigForActor(actorUserId: string, id: string, tErrors: ErrorsLabels) {
    const config = await UserMeetingConfigRepository.getByIdOrThrow(id, tErrors);
    const access = await assertCanAccessConfig(actorUserId, config.userId, tErrors);
    return { config, ...access };
  }

  export async function getUserMeetingConfig(
    actorUserId: string,
    id: string,
    tErrors: ErrorsLabels
  ): Promise<UserMeetingConfigReturnType> {
    const { config, isAdminScope } = await loadConfigForActor(actorUserId, id, tErrors);
    const providerMap = await resolveProvidersForConfigs([config]);
    return buildMaskedMeetingConfig(config, isAdminScope, providerMap);
  }

  export async function createUserMeetingConfig(
    actorUserId: string,
    input: UserMeetingConfigSubmitInput,
    tErrors: ErrorsLabels
  ): Promise<UserMeetingConfigReturnType> {
    const { isAdminScope } = await assertCanManageUser(actorUserId, input.userId, tErrors);
    const provider = await MeetingProviderRepository.getByIdOrThrow(input.providerId, tErrors);

    if (!provider.isActive) {
      throw new Error(tErrors.meetingProviderInactive);
    }

    const details = parseMeetingConfigDetails(provider, input.details);

    const created = await UserMeetingConfigRepository.create(
      {
        userId: input.userId,
        providerId: input.providerId,
        label: input.label ?? null,
        isDefault: input.isDefault,
        details,
        encryptedSecret: input.password ?? null,
      },
      tErrors
    );

    const providerMap = await resolveProvidersForConfigs([created]);
    return buildMaskedMeetingConfig(created, isAdminScope, providerMap);
  }

  export async function updateUserMeetingConfig(
    actorUserId: string,
    id: string,
    input: UpdateUserMeetingConfigInput,
    tErrors: ErrorsLabels
  ): Promise<UserMeetingConfigReturnType> {
    const existing = await UserMeetingConfigRepository.getByIdOrThrow(id, tErrors);
    const { isAdminScope } = await assertCanAccessConfig(actorUserId, existing.userId, tErrors);

    const nextProviderId = input.providerId ?? existing.providerId;
    const provider = await MeetingProviderRepository.getByIdOrThrow(nextProviderId, tErrors);

    if (input.providerId && input.providerId !== existing.providerId && !provider.isActive) {
      throw new Error(tErrors.meetingProviderInactive);
    }

    const detailsSource = input.details ?? existing.details;
    const details =
      input.details !== undefined || (input.providerId && input.providerId !== existing.providerId)
        ? parseMeetingConfigDetails(provider, detailsSource)
        : undefined;

    const updated = await UserMeetingConfigRepository.update(
      id,
      {
        ...(input.providerId ? { providerId: input.providerId } : {}),
        label: input.label,
        isDefault: input.isDefault,
        details,
        encryptedSecret: input.password,
      },
      tErrors
    );

    const providerMap = await resolveProvidersForConfigs([updated]);
    return buildMaskedMeetingConfig(updated, isAdminScope, providerMap);
  }

  export async function deleteUserMeetingConfig(
    actorUserId: string,
    id: string,
    tErrors: ErrorsLabels
  ): Promise<{ id: string }> {
    const existing = await UserMeetingConfigRepository.getByIdOrThrow(id, tErrors);
    await assertCanAccessConfig(actorUserId, existing.userId, tErrors);
    await UserMeetingConfigRepository.deleteConfig(id, tErrors);
    return { id };
  }

  export async function setDefaultMeetingConfig(
    actorUserId: string,
    id: string,
    tErrors: ErrorsLabels
  ): Promise<UserMeetingConfigReturnType> {
    const { isAdminScope } = await loadConfigForActor(actorUserId, id, tErrors);
    const updated = await UserMeetingConfigRepository.setDefault(id, tErrors);
    const providerMap = await resolveProvidersForConfigs([updated]);
    return buildMaskedMeetingConfig(updated, isAdminScope, providerMap);
  }

  // ─── Bootstrap / Seeder Operations (no auth) ──────────────────────────────

  export async function upsertManyUserMeetingConfigs(
    inputs: readonly UserMeetingConfigSubmitInput[],
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<UserMeetingConfigReturnType[]> {
    if (inputs.length === 0) return [];

    const results: UserMeetingConfigSelectType[] = [];
    for (const input of inputs) {
      const provider = await MeetingProviderRepository.getByIdOrThrow(input.providerId, tErrors, tx);
      const details = parseMeetingConfigDetails(provider, input.details);
      const upserted = await UserMeetingConfigRepository.upsertMany(
        [
          {
            userId: input.userId,
            providerId: input.providerId,
            label: input.label ?? null,
            isDefault: input.isDefault,
            details,
            encryptedSecret: input.password ?? null,
          },
        ],
        tErrors,
        tx
      );
      results.push(...upserted);
    }

    const providerMap = await resolveProvidersForConfigs(results);
    return buildMaskedMeetingConfigs(results, true, providerMap);
  }

  export async function upsertManyClassMeetingConfigs(
    inputs: readonly ClassMeetingConfigInsertType[],
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<ClassMeetingConfigSelectType[]> {
    if (inputs.length === 0) return [];

    const prepared: ClassMeetingConfigInsertType[] = [];
    for (const input of inputs) {
      const provider = await MeetingProviderRepository.getByIdOrThrow(input.providerId, tErrors, tx);
      prepared.push({
        ...input,
        details: parseMeetingConfigDetails(provider, input.details),
        encryptedSecret: input.encryptedSecret ?? null,
      });
    }

    return ClassMeetingConfigRepository.upsertMany(prepared, tErrors, tx);
  }
}
