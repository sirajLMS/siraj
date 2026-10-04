import { ParentRepository, SuggestionRepository } from "@/backend/db/repo/parents";
import { SoftDeleteRepository } from "@/backend/db/repo/shared";
import { AppPermission } from "@/backend/enum";
import { NotFoundError, ValidationError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import {
  assertPermission,
  requireParentByActorUserId,
  resolveEntityById,
  softDeleteEntityLog,
} from "@/backend/services/communication/__shared__/complaintSuggestionBase";
import {
  anonymizeContributorId,
  anonymizeContributorName,
  dispatchSuggestionMarkedDuplicate,
  dispatchSuggestionResponse,
  mapAdminSuggestionRow,
  mapSuggestionSearchResult,
  mapSuggestionSelectToReturn,
  normalizeSuggestion,
  notifySuggestionSubmitted,
  resolveDuplicateTarget,
} from "@/backend/services/communication/suggestion.service.helpers";
import type {
  ParentSuggestionOptions,
  SuggestionContributorStats,
  SuggestionQueueFilter,
  SuggestionQueueResult,
  SuggestionReturnType,
  SuggestionSearchResultType,
  SuggestionSelectType,
  SuggestionSubmitInput,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export namespace SuggestionService {
  export function mapSuggestionReturnType(result: SuggestionSelectType): SuggestionReturnType {
    return mapSuggestionSelectToReturn(result);
  }

  export async function submitSuggestion(
    actorUserId: string,
    input: SuggestionSubmitInput,
    locale?: string
  ): Promise<SuggestionSelectType> {
    const parent = await requireParentByActorUserId(actorUserId, AppPermission.COMMUNICATION_SUBMIT_SUGGESTION, locale);

    try {
      const created = await SuggestionRepository.submitSuggestion(
        {
          parentId: parent.id,
          submitterName: input.submitterName,
          body: input.body,
        },
        undefined,
        locale
      );

      await notifySuggestionSubmitted(created, actorUserId, locale);

      logger.info("Suggestion submitted", {
        actorUserId,
        suggestionId: created.id,
        parentId: parent.id,
      });

      return created;
    } catch (error) {
      logger.error("Failed to submit suggestion", { actorUserId, error });
      throw error;
    }
  }

  export async function getAdminSuggestions(
    actorUserId: string,
    options: SuggestionQueueFilter,
    locale?: string
  ): Promise<SuggestionQueueResult> {
    await assertPermission(actorUserId, AppPermission.SUGGESTIONS_LIST, locale);

    try {
      const result = await SuggestionRepository.getAdminSuggestionQueue({
        limit: options.limit,
        offset: options.offset,
        status: options.status ?? null,
        search: options.search ?? null,
      });

      const metrics = await SuggestionRepository.getSuggestionMetrics();

      return {
        id: "admin-suggestion-result",
        suggestions: result.rows.map(mapAdminSuggestionRow),
        metrics: {
          id: "suggestion-metrics",
          pending: metrics.pending,
          reviewed: metrics.reviewed,
          duplicate: metrics.duplicate,
          avgResponseTime: null,
          totalCount: result.totalCount,
        },
      };
    } catch (error) {
      logger.error("Failed to get admin suggestions", { actorUserId, options, error });
      throw error;
    }
  }

  export async function markSuggestionReviewed(
    actorUserId: string,
    suggestionId: string,
    locale?: string
  ): Promise<SuggestionSelectType> {
    await assertPermission(actorUserId, AppPermission.SUGGESTIONS_REVIEW, locale);

    try {
      const updated = await SuggestionRepository.markSuggestionReviewed(
        {
          suggestionId,
          reviewedByUserId: actorUserId,
        },
        undefined,
        locale
      );

      logger.info("Suggestion marked as reviewed", {
        actorUserId,
        suggestionId: updated.id,
      });

      return updated;
    } catch (error) {
      if (error instanceof NotFoundError) {
        logger.logDomainError("Failed to mark suggestion as reviewed (not found)", {
          actorUserId,
          suggestionId,
          error,
        });
      } else {
        logger.error("Failed to mark suggestion as reviewed", { actorUserId, suggestionId, error });
      }
      throw error;
    }
  }

  export async function getParentSuggestions(
    actorUserId: string,
    options: ParentSuggestionOptions,
    locale?: string
  ): Promise<ReadonlyArray<SuggestionReturnType>> {
    const parent = await requireParentByActorUserId(actorUserId, AppPermission.SUPPORT_VIEW_HISTORY, locale);

    try {
      const suggestions = await SuggestionRepository.getSuggestionsByParent(parent.id, options);

      logger.info("Parent suggestions retrieved", {
        actorUserId,
        parentId: parent.id,
        count: suggestions.length,
      });

      return suggestions.map(normalizeSuggestion);
    } catch (error) {
      logger.error("Failed to get parent suggestions", { actorUserId, parentId: parent.id, error });
      throw error;
    }
  }

  export async function searchSuggestions(
    actorUserId: string,
    query: string,
    excludeId: string,
    locale?: string
  ): Promise<ReadonlyArray<SuggestionSearchResultType>> {
    await assertPermission(actorUserId, AppPermission.SUGGESTIONS_REVIEW, locale);

    try {
      return (await SuggestionRepository.searchSuggestions(query, excludeId)).map(mapSuggestionSearchResult);
    } catch (error) {
      logger.error("Failed to search suggestions", { actorUserId, query, excludeId, error });
      throw error;
    }
  }

  export async function respondToSuggestion(
    actorUserId: string,
    suggestionId: string,
    adminResponse: string,
    locale?: string
  ): Promise<SuggestionSelectType> {
    const suggestion = await resolveEntityById({
      actorUserId,
      permission: AppPermission.SUGGESTIONS_REVIEW,
      entityId: suggestionId,
      findFn: SuggestionRepository.getSuggestionById,
      notFoundErrorKey: "suggestionNotFound",
      entityCode: "SUGGESTION",
      locale,
    });

    try {
      const updated = await SuggestionRepository.respondToSuggestion(
        {
          suggestionId,
          adminResponse,
          reviewedByUserId: actorUserId,
        },
        undefined,
        locale
      );

      const parentProfile = await ParentRepository.getParentProfile(suggestion.parentId);
      if (parentProfile) {
        await dispatchSuggestionResponse(parentProfile, adminResponse, suggestionId, locale);
      }

      logger.info("Suggestion responded to", {
        actorUserId,
        suggestionId,
        adminResponseLength: adminResponse.length,
      });

      return updated;
    } catch (error) {
      logger.error("Failed to respond to suggestion", { actorUserId, suggestionId, error });
      throw error;
    }
  }

  export async function markAsDuplicate(
    actorUserId: string,
    suggestionId: string,
    duplicateOfId: string,
    locale?: string
  ): Promise<SuggestionSelectType> {
    await assertPermission(actorUserId, AppPermission.SUGGESTIONS_REVIEW, locale);

    const sourceSuggestion = await resolveDuplicateTarget(suggestionId, duplicateOfId, locale);

    try {
      const updated = await SuggestionRepository.markAsDuplicate(
        {
          suggestionId,
          duplicateOfId,
          reviewedByUserId: actorUserId,
        },
        undefined,
        locale
      );

      const parentProfile = await ParentRepository.getParentProfile(sourceSuggestion.parentId);
      if (parentProfile) {
        await dispatchSuggestionMarkedDuplicate(parentProfile.userId, duplicateOfId, locale);
      }

      logger.info("Suggestion marked as duplicate", {
        actorUserId,
        suggestionId,
        duplicateOfId,
      });

      return updated;
    } catch (error) {
      logger.error("Failed to mark suggestion as duplicate", { actorUserId, suggestionId, duplicateOfId, error });
      throw error;
    }
  }

  export async function deleteSuggestion(
    actorUserId: string,
    suggestionId: string,
    locale?: string
  ): Promise<{ readonly deletedAt: string }> {
    await resolveEntityById({
      actorUserId,
      permission: AppPermission.SUGGESTIONS_DELETE,
      entityId: suggestionId,
      findFn: SuggestionRepository.getSuggestionById,
      notFoundErrorKey: "suggestionNotFound",
      entityCode: "SUGGESTION",
      locale,
    });

    return softDeleteEntityLog({
      actorUserId,
      entityLabel: "Suggestion",
      idKey: "suggestionId",
      entityId: suggestionId,
      deleteFn: SoftDeleteRepository.softDeleteSuggestion,
    });
  }

  export async function getContributorStats(
    actorUserId: string,
    days: number,
    locale?: string
  ): Promise<SuggestionContributorStats> {
    await assertPermission(actorUserId, AppPermission.COMMUNICATION_SUBMIT_SUGGESTION, locale);

    if (days < 1 || days > 365) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new ValidationError("INVALID_INPUT", tErrors.invalidInput);
    }

    try {
      const result = await SuggestionRepository.getContributorStats(days);

      const anonymized: SuggestionContributorStats = {
        ...result,
        contributors: result.contributors.map(contributor => ({
          id: anonymizeContributorId(contributor.id),
          name: anonymizeContributorName(contributor.name),
          suggestionCount: contributor.suggestionCount,
        })),
      };

      logger.info("Suggestion contributor stats retrieved", {
        actorUserId,
        days,
        uniqueContributorCount: anonymized.uniqueContributorCount,
      });

      return anonymized;
    } catch (error) {
      logger.error("Failed to get suggestion contributor stats", { actorUserId, days, error });
      throw error;
    }
  }

  // ─── Bootstrap / Seeder Operations (no auth) ──────────────────────────────

  export async function createManySuggestions(
    inputs: Parameters<typeof SuggestionRepository.insertSuggestion>[0][]
  ): Promise<SuggestionSelectType[]> {
    return SuggestionRepository.insertManySuggestions(inputs);
  }
}
