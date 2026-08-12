import { ClassMeetingConfigRepository } from "@/backend/db/repo/meeting/class-meeting-config.repository";
import { MeetingProviderRepository } from "@/backend/db/repo/meeting/meeting-provider.repository";
import { UserMeetingConfigRepository } from "@/backend/db/repo/meeting/user-meeting-config.repository";
import { AppPermission } from "@/backend/enum";
import { parseMeetingConfigDetails } from "@/backend/lib/meeting-config.validation";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  resolveProvidersForConfigs,
  safeMaybeGenerateUrl,
} from "@/backend/services/meeting/__shared__/meetingConfigHelpers";
import { prepareMeetingConfigUpsert } from "@/backend/services/meeting/__shared__/prepareMeetingConfigUpsert";
import { buildMaskedMeetingConfig, buildMaskedMeetingConfigs } from "@/backend/services/meeting/meeting-config-mask";
import type { DBTransaction } from "@/backend/types";
import type { MeetingConfigDetails } from "@/backend/types/meeting";
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
import type { ErrorsLabels } from "@/shared/locale";

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

  async function buildMaskedConfigResult(
    config: UserMeetingConfigSelectType,
    isAdminScope: boolean
  ): Promise<UserMeetingConfigReturnType> {
    const providerMap = await resolveProvidersForConfigs([config]);
    return buildMaskedMeetingConfig(config, isAdminScope, providerMap);
  }

  function buildMaskedConfigResults(
    configs: UserMeetingConfigSelectType[],
    isAdminScope: boolean
  ): Promise<UserMeetingConfigReturnType[]> {
    return resolveProvidersForConfigs(configs).then(map => buildMaskedMeetingConfigs(configs, isAdminScope, map));
  }

  export async function listUserMeetingConfigs(
    actorUserId: string,
    userId: string,
    tErrors: ErrorsLabels
  ): Promise<UserMeetingConfigReturnType[]> {
    const { isAdminScope } = await assertCanManageUser(actorUserId, userId, tErrors);
    const rows = await UserMeetingConfigRepository.listByUserId(userId);
    return buildMaskedConfigResults(rows, isAdminScope);
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
    return buildMaskedConfigResult(config, isAdminScope);
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

    const parsedDetails = parseMeetingConfigDetails(provider, input.details);
    const { details, providerMetadata, encryptedSecret } = await safeMaybeGenerateUrl(
      provider,
      parsedDetails,
      {
        topic: input.label ?? "Personal Meeting",
        actorUserId,
      },
      tErrors.meetingConfigCreateFailed
    );

    const created = await UserMeetingConfigRepository.create(
      {
        userId: input.userId,
        providerId: input.providerId,
        label: input.label ?? null,
        isDefault: input.isDefault,
        details,
        encryptedSecret: input.password ?? encryptedSecret ?? null,
        providerMetadata,
      },
      tErrors
    );

    return buildMaskedConfigResult(created, isAdminScope);
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
    const providerChanged = input.providerId && input.providerId !== existing.providerId;
    const detailsChanged = input.details !== undefined;

    let details: MeetingConfigDetails | undefined;
    let providerMetadata: Record<string, unknown> | null | undefined;

    if (detailsChanged || providerChanged) {
      const parsed = parseMeetingConfigDetails(provider, detailsSource);

      // If details Changed AND meetingUrl is absent (omitted or explicitly null),
      // it means "regenerate" for auto providers. For manual providers Zod requires
      // a URL, so parsed.meetingUrl will always be a non-empty string.
      const shouldRegenerate =
        (input.forceRegenerate && provider.providerKind !== "manual") ||
        (!parsed.meetingUrl && provider.providerKind !== "manual" && detailsChanged);

      if (shouldRegenerate) {
        const { details: generatedDetails, providerMetadata: generatedMeta } = await safeMaybeGenerateUrl(
          provider,
          parsed,
          { topic: input.label ?? existing.label ?? "Personal Meeting", actorUserId },
          tErrors.meetingConfigUpdateFailed
        );
        details = generatedDetails;
        providerMetadata = generatedMeta;
      } else {
        const result = await safeMaybeGenerateUrl(
          provider,
          parsed,
          {
            topic: input.label ?? existing.label ?? "Personal Meeting",
            actorUserId,
          },
          tErrors.meetingConfigUpdateFailed
        );
        details = result.details;
        providerMetadata = result.providerMetadata;

        // If generation didn't run (manual/override), preserve existing metadata on updates.
        if (providerMetadata === null && !detailsChanged) {
          providerMetadata = existing.providerMetadata ?? null;
        }
      }
    }

    const updated = await UserMeetingConfigRepository.update(
      id,
      {
        ...(input.providerId ? { providerId: input.providerId } : {}),
        label: input.label,
        isDefault: input.isDefault,
        details,
        encryptedSecret: input.password,
        providerMetadata,
      },
      tErrors
    );

    return buildMaskedConfigResult(updated, isAdminScope);
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
    return buildMaskedConfigResult(updated, isAdminScope);
  }

  // ─── Bootstrap / Seeder Operations (no auth) ──────────────────────────────

  export async function upsertManyUserMeetingConfigs(
    inputs: readonly UserMeetingConfigSubmitInput[],
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<UserMeetingConfigReturnType[]> {
    const prepared = await prepareMeetingConfigUpsert(
      inputs,
      { topicDefault: "Personal Meeting", tx, tErrors },
      buildUserUpsertPayload
    );
    const results = await UserMeetingConfigRepository.upsertMany(prepared, tErrors, tx);
    return buildMaskedConfigResults(results, true);
  }

  function buildUserUpsertPayload(
    input: UserMeetingConfigSubmitInput,
    ctx: {
      details: MeetingConfigDetails;
      providerMetadata: Record<string, unknown> | null;
      encryptedSecret?: string | null;
    }
  ) {
    return {
      userId: input.userId,
      providerId: input.providerId,
      label: input.label ?? null,
      isDefault: input.isDefault,
      details: ctx.details,
      encryptedSecret: input.password ?? ctx.encryptedSecret ?? null,
      providerMetadata: ctx.providerMetadata,
    };
  }

  export async function upsertManyClassMeetingConfigs(
    inputs: readonly ClassMeetingConfigInsertType[],
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<ClassMeetingConfigSelectType[]> {
    const prepared = await prepareMeetingConfigUpsert(
      inputs,
      { topicDefault: "Class Meeting", tx, tErrors },
      buildClassUpsertPayload
    );
    return ClassMeetingConfigRepository.upsertMany(prepared, tErrors, tx);
  }

  function buildClassUpsertPayload(
    input: ClassMeetingConfigInsertType,
    ctx: {
      details: MeetingConfigDetails;
      providerMetadata: Record<string, unknown> | null;
    }
  ) {
    return Object.assign({}, input, {
      details: ctx.details,
      encryptedSecret: input.encryptedSecret ?? null,
      providerMetadata: ctx.providerMetadata ?? null,
    });
  }
}
