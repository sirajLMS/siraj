import { MeetingProviderRepository } from "@/backend/db/repo/meeting/meeting-provider.repository";
import { AppPermission } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import {
  parseMeetingProviderSubmitInput,
  parseUpdateMeetingProviderInput,
} from "@/backend/lib/meeting-provider.validation";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  MeetingProviderReturnType,
  MeetingProviderSubmitInput,
  UpdateMeetingProviderInput,
} from "@/backend/types/meeting/meeting-provider.types";

export namespace MeetingProviderCatalogService {
  async function assertManageCatalog(userId: string, locale?: string): Promise<void> {
    const allowed = await PermissionsService.hasPermission(userId, AppPermission.MEETING_PROVIDERS_MANAGE_CATALOG);
    if (!allowed) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("unauthorizedAction"));
    }
  }

  export async function listProviders(
    userId: string,
    activeOnly = false,
    locale?: string
  ): Promise<MeetingProviderReturnType[]> {
    if (activeOnly) {
      return MeetingProviderRepository.listActive();
    }
    await assertManageCatalog(userId, locale);
    return MeetingProviderRepository.listAll();
  }

  export async function getProviderById(
    userId: string,
    id: string,
    locale?: string
  ): Promise<MeetingProviderReturnType> {
    const provider = await MeetingProviderRepository.getByIdOrThrow(id, undefined, locale);
    if (!provider.isActive) {
      await assertManageCatalog(userId, locale);
    }
    return provider;
  }

  export async function createProvider(
    userId: string,
    input: MeetingProviderSubmitInput,
    locale?: string
  ): Promise<MeetingProviderReturnType> {
    await assertManageCatalog(userId, locale);
    const parsed = parseMeetingProviderSubmitInput(input);
    return MeetingProviderRepository.create(parsed, undefined, locale);
  }

  export async function updateProvider(
    userId: string,
    id: string,
    input: UpdateMeetingProviderInput,
    locale?: string
  ): Promise<MeetingProviderReturnType> {
    await assertManageCatalog(userId, locale);
    const parsed = parseUpdateMeetingProviderInput(input);
    return MeetingProviderRepository.update(id, parsed, undefined, locale);
  }

  export async function deleteProvider(userId: string, id: string, locale?: string): Promise<{ id: string }> {
    await assertManageCatalog(userId, locale);
    await MeetingProviderRepository.deleteProvider(id, undefined, locale);
    return { id };
  }
}
