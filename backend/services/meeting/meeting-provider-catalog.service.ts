import { MeetingProviderRepository } from "@/backend/db/repo/meeting";
import { AppPermission } from "@/backend/enum";
import {
  parseMeetingProviderSubmitInput,
  parseUpdateMeetingProviderInput,
} from "@/backend/lib/meeting-provider.validation";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { isDuplicateError } from "@/backend/services/shared/is-duplicate-error";
import type {
  DBTransaction,
  MeetingProviderSelectType,
  MeetingProviderSubmitInput,
  UpdateMeetingProviderInput,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace MeetingProviderCatalogService {
  async function assertManageCatalog(userId: string, tErrors: ErrorsLabels): Promise<void> {
    const allowed = await PermissionsService.hasPermission(userId, AppPermission.MEETING_PROVIDERS_MANAGE_CATALOG);
    if (!allowed) {
      throw new Error(tErrors.unauthorizedAction);
    }
  }

  export async function listProviders(
    userId: string,
    tErrors: ErrorsLabels,
    activeOnly = false
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

  /**
   * Batch-fetch providers by IDs. Returns a Map keyed by provider ID.
   * Does NOT perform permission checks — callers must handle auth.
   */
  export async function getProvidersByIds(
    ids: string[],
    tx?: DBTransaction
  ): Promise<Map<string, MeetingProviderSelectType>> {
    if (ids.length === 0) return new Map();
    const providers = await MeetingProviderRepository.getByIds(ids, tx);
    return new Map(providers.map(p => [p.id, p]));
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
        const existingProviders = await Promise.all(
          inputs.map(input => MeetingProviderRepository.getBySlug(input.slug, tx))
        );
        const toUpdate = inputs
          .map((input, index) => ({ input, existing: existingProviders[index] }))
          .filter(
            (entry): entry is { input: MeetingProviderSubmitInput; existing: NonNullable<typeof entry.existing> } =>
              entry.existing !== null
          );
        return Promise.all(
          toUpdate.map(({ input, existing }) =>
            MeetingProviderRepository.update(existing.id, { ...input, isActive: input.isActive ?? true }, tErrors, tx)
          )
        );
      }
      throw error;
    }
  }
}
