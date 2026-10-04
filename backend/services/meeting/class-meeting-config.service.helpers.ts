import { ClassMeetingConfigRepository } from "@/backend/db/repo/meeting/class-meeting-config.repository";
import { MeetingProviderRepository } from "@/backend/db/repo/meeting/meeting-provider.repository";
import { AppPermission } from "@/backend/enum";
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
import type {
  ClassMeetingConfigReturnType,
  ClassMeetingConfigSelectType,
  ClassMeetingConfigSubmitInput,
  MeetingConfigDetails,
  UpdateClassMeetingConfigInput,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

async function assertCanManageClass(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
  const canManage = await PermissionsService.hasPermission(actorUserId, AppPermission.MEETING_CONFIGS_MANAGE_CLASS);
  if (!canManage) {
    throw new Error(tErrors.unauthorizedAction);
  }
}

export async function resolveAndMaskConfig(
  config: ClassMeetingConfigSelectType
): Promise<ClassMeetingConfigReturnType> {
  const providerMap = await resolveProvidersForConfigs([config]);
  return buildMaskedClassMeetingConfig(config, true, providerMap);
}

export async function listScopedConfigs(
  actorUserId: string,
  scope: { classInstanceId: string } | { recurringScheduleId: string },
  tErrors: ErrorsLabels
): Promise<ClassMeetingConfigReturnType[]> {
  await assertCanManageClass(actorUserId, tErrors);
  const rows = await ClassMeetingConfigRepository.listByScope(scope);
  const providerMap = await resolveProvidersForConfigs(rows);
  return buildMaskedClassMeetingConfigs(rows, true, providerMap);
}

export async function loadConfigForActor(
  actorUserId: string,
  id: string,
  tErrors: ErrorsLabels
): Promise<ClassMeetingConfigSelectType> {
  await assertCanManageClass(actorUserId, tErrors);
  return ClassMeetingConfigRepository.getByIdOrThrow(id, tErrors);
}

export async function createClassMeetingConfigInternal(
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

export async function updateClassMeetingConfigInternal(
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
