import type { DBTransaction } from "@/backend/db/db.types";
import { MeetingProviderRepository } from "@/backend/db/repo/meeting/meeting-provider.repository";
import { AppPermission } from "@/backend/enum";
import {
  parseMeetingProviderSubmitInput,
  parseUpdateMeetingProviderInput,
} from "@/backend/lib/meeting-provider.validation";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { isDuplicateError } from "@/backend/services/shared/is-duplicate-error";
import type {
  MeetingProviderSelectType,
  MeetingProviderSubmitInput,
  UpdateMeetingProviderInput,
} from "@/backend/types/meeting/meeting-provider.types";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

export namespace MeetingProviderCatalogService {
  async function assertManageCatalog(userId: string, tErrors: ErrorsLabels): Promise<void> {
    const allowed = await PermissionsService.hasPermission(userId, AppPermission.MEETING_PROVIDERS_MANAGE_CATALOG);
    if (!allowed) {
      throw new Error(tErrors.unauthorizedAction);
    }
  }

  export async function listProviders(
    userId: string,
    activeOnly = false,
    tErrors: ErrorsLabels
  ): Promise<MeetingProviderSelectType[]> {
    if (activeOnly) {
      return MeetingProviderRepository.listActive();
    }
    await assertManageCatalog(userId, tErrors);
    return MeetingProviderRepository.listAll();
  }

  export async function getProviderById(
    userId: string,
    id: string,
    tErrors: ErrorsLabels
  ): Promise<MeetingProviderSelectType> {
    const provider = await MeetingProviderRepository.getByIdOrThrow(id, tErrors);
    if (!provider.isActive) {
      await assertManageCatalog(userId, tErrors);
    }
    return provider;
  }

  export async function createProvider(
    userId: string,
    input: MeetingProviderSubmitInput,
    tErrors: ErrorsLabels
  ): Promise<MeetingProviderSelectType> {
    await assertManageCatalog(userId, tErrors);
    return MeetingProviderRepository.create(parseMeetingProviderSubmitInput(input), tErrors);
  }

  export async function updateProvider(
    userId: string,
    id: string,
    input: UpdateMeetingProviderInput,
    tErrors: ErrorsLabels
  ): Promise<MeetingProviderSelectType> {
    await assertManageCatalog(userId, tErrors);
    return MeetingProviderRepository.update(id, parseUpdateMeetingProviderInput(input), tErrors);
  }

  export async function deleteProvider(userId: string, id: string, tErrors: ErrorsLabels): Promise<{ id: string }> {
    await assertManageCatalog(userId, tErrors);
    await MeetingProviderRepository.deleteProvider(id, tErrors);
    return { id };
  }

  /** List all providers without auth (seed / bootstrap use). */
  export async function listAllProviders(tx?: DBTransaction): Promise<MeetingProviderSelectType[]> {
    return MeetingProviderRepository.listAll(tx);
  }

  /** Upsert many providers by slug without auth (seed / bootstrap use). */
  export async function upsertManyProviders(
    inputs: readonly MeetingProviderSubmitInput[],
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<MeetingProviderSelectType[]> {
    if (inputs.length === 0) return [];

    try {
      return await MeetingProviderRepository.upsertMany(inputs, tErrors, tx);
    } catch (error) {
      if (isDuplicateError(error)) {
        const results: MeetingProviderSelectType[] = [];
        for (const input of inputs) {
          const existing = await MeetingProviderRepository.getBySlug(input.slug, tx);
          if (existing) {
            results.push(
              await MeetingProviderRepository.update(
                existing.id,
                { ...input, isActive: input.isActive ?? true },
                tErrors,
                tx
              )
            );
          }
        }
        return results;
      }
      throw error;
    }
  }
}
