import { MeetingProviderRepository } from "@/backend/db/repo/meeting/meeting-provider.repository";
import { UserMeetingConfigRepository } from "@/backend/db/repo/meeting/user-meeting-config.repository";
import { AppPermission } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { parseMeetingConfigDetails } from "@/backend/lib/meeting-config.validation";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { buildMaskedMeetingConfig, buildMaskedMeetingConfigs } from "@/backend/services/meeting/meeting-config-mask";
import type {
  UpdateUserMeetingConfigInput,
  UserMeetingConfigReturnType,
  UserMeetingConfigSubmitInput,
} from "@/backend/types/meeting/meeting-config.types";

export namespace MeetingConfigService {
  async function assertCanManageUser(
    actorUserId: string,
    targetUserId: string,
    locale?: string
  ): Promise<{ isAdminScope: boolean }> {
    if (actorUserId === targetUserId) {
      const canManageOwn = await PermissionsService.hasPermission(
        actorUserId,
        AppPermission.MEETING_CONFIGS_MANAGE_OWN
      );
      if (!canManageOwn) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("unauthorizedAction"));
      }
      return { isAdminScope: false };
    }

    const canManageOther = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.MEETING_CONFIGS_MANAGE_OTHER
    );
    if (!canManageOther) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("unauthorizedAction"));
    }
    return { isAdminScope: true };
  }

  async function assertCanAccessConfig(
    actorUserId: string,
    configUserId: string,
    locale?: string
  ): Promise<{ isAdminScope: boolean }> {
    return assertCanManageUser(actorUserId, configUserId, locale);
  }

  export async function listUserMeetingConfigs(
    actorUserId: string,
    userId: string,
    locale?: string
  ): Promise<UserMeetingConfigReturnType[]> {
    const { isAdminScope } = await assertCanManageUser(actorUserId, userId, locale);
    const rows = await UserMeetingConfigRepository.listByUserId(userId);
    return buildMaskedMeetingConfigs(rows, isAdminScope);
  }

  async function loadConfigForActor(actorUserId: string, id: string, locale?: string) {
    const config = await UserMeetingConfigRepository.getByIdOrThrow(id, undefined, locale);
    const access = await assertCanAccessConfig(actorUserId, config.userId, locale);
    return { config, ...access };
  }

  export async function getUserMeetingConfig(
    actorUserId: string,
    id: string,
    locale?: string
  ): Promise<UserMeetingConfigReturnType> {
    const { config, isAdminScope } = await loadConfigForActor(actorUserId, id, locale);
    return buildMaskedMeetingConfig(config, isAdminScope);
  }

  export async function createUserMeetingConfig(
    actorUserId: string,
    input: UserMeetingConfigSubmitInput,
    locale?: string
  ): Promise<UserMeetingConfigReturnType> {
    const { isAdminScope } = await assertCanManageUser(actorUserId, input.userId, locale);
    const provider = await MeetingProviderRepository.getByIdOrThrow(input.providerId, undefined, locale);

    if (!provider.isActive) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("meetingProviderInactive"));
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
      undefined,
      locale
    );

    return buildMaskedMeetingConfig(created, isAdminScope);
  }

  export async function updateUserMeetingConfig(
    actorUserId: string,
    id: string,
    input: UpdateUserMeetingConfigInput,
    locale?: string
  ): Promise<UserMeetingConfigReturnType> {
    const existing = await UserMeetingConfigRepository.getByIdOrThrow(id, undefined, locale);
    const { isAdminScope } = await assertCanAccessConfig(actorUserId, existing.userId, locale);
    const provider = await MeetingProviderRepository.getByIdOrThrow(existing.providerId, undefined, locale);

    const details = input.details !== undefined ? parseMeetingConfigDetails(provider, input.details) : undefined;

    const updated = await UserMeetingConfigRepository.update(
      id,
      {
        label: input.label,
        isDefault: input.isDefault,
        details,
        encryptedSecret: input.password !== undefined ? input.password : undefined,
      },
      undefined,
      locale
    );

    return buildMaskedMeetingConfig(updated, isAdminScope);
  }

  export async function deleteUserMeetingConfig(
    actorUserId: string,
    id: string,
    locale?: string
  ): Promise<{ id: string }> {
    const existing = await UserMeetingConfigRepository.getByIdOrThrow(id, undefined, locale);
    await assertCanAccessConfig(actorUserId, existing.userId, locale);
    await UserMeetingConfigRepository.deleteConfig(id, undefined, locale);
    return { id };
  }

  export async function setDefaultMeetingConfig(
    actorUserId: string,
    id: string,
    locale?: string
  ): Promise<UserMeetingConfigReturnType> {
    const { isAdminScope } = await loadConfigForActor(actorUserId, id, locale);
    const updated = await UserMeetingConfigRepository.setDefault(id, undefined, locale);
    return buildMaskedMeetingConfig(updated, isAdminScope);
  }
}
