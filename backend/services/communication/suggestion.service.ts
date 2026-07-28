import { ParentRepository, SoftDeleteRepository, SuggestionRepository, UserRepository } from "@/backend/db/repo";
import { AppPermission, NotificationEventType, SuggestionStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { CommunicationService, PermissionsService } from "@/backend/services";
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
  export async function submitSuggestion(
    actorUserId: string,
    input: SuggestionSubmitInput,
    locale?: string
  ): Promise<SuggestionSelectType> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.COMMUNICATION_SUBMIT_SUGGESTION
    );
    if (!hasPermission) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(tErrors.insufficientPermissions);
    }

    const parent = await ParentRepository.findByUserId(actorUserId);
    if (!parent) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(tErrors.parentNotFound);
    }

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

      // Resolve the submitter's email so the email adapter has a valid `to`.
      // `parent` (from `findByUserId`) is the `parents` row — email lives on
      // `users`, so fetch via `UserRepository.findSafeById`. Legacy direct-
      // dispatch path (F1 grandfather): `metadata.to` populated inline.
      const submitter = await UserRepository.findSafeById(actorUserId);
      const to = submitter?.email ?? "";
      if (!to) {
        logger.warn("Suggestion email dispatch skipped: submitter has no email", {
          actorUserId,
          suggestionId: created.id,
        });
      } else {
        await CommunicationService.dispatch(
          {
            userId: actorUserId,
            title: "New Suggestion Submitted",
            body: created.body,
            channel: "email",
            eventType: NotificationEventType.NEW_SUGGESTION,
            metadata: { to, entityKind: "suggestion", entityId: created.id },
          },
          locale
        );
      }

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
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SUGGESTIONS_LIST);
    if (!hasPermission) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(tErrors.insufficientPermissions);
    }

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
        suggestions: result.rows.map(row => ({
          id: row.id,
          parentId: row.parentId,
          parentUserId: row.parentUserId,
          submitterName: row.submitterName,
          body: row.body,
          status: row.status as SuggestionStatus,
          duplicateOfId: row.duplicateOfId,
          adminResponse: row.adminResponse,
          reviewedByUserId: row.reviewedByUserId,
          reviewedAt: row.reviewedAt,
          emailSentAt: null,
          createdAt: row.createdAt,
          parentName: row.parentName ?? null,
          reviewedByUserName: row.reviewerName ?? null,
          duplicateOfBody: row.duplicateOfBody ?? null,
          duplicateOfSubmitterName: row.duplicateOfSubmitterName ?? null,
          responseCount: 0,
        })),
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
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SUGGESTIONS_REVIEW);
    if (!hasPermission) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(tErrors.insufficientPermissions);
    }

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
      logger.error("Failed to mark suggestion as reviewed", { actorUserId, suggestionId, error });
      throw error;
    }
  }

  export async function getParentSuggestions(
    actorUserId: string,
    options: ParentSuggestionOptions,
    locale?: string
  ): Promise<ReadonlyArray<SuggestionReturnType>> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SUPPORT_VIEW_HISTORY);
    if (!hasPermission) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(tErrors.insufficientPermissions);
    }

    const parent = await ParentRepository.findByUserId(actorUserId);
    if (!parent) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(tErrors.parentNotFound);
    }

    try {
      const suggestions = await SuggestionRepository.getSuggestionsByParent(parent.id, options);

      logger.info("Parent suggestions retrieved", {
        actorUserId,
        parentId: parent.id,
        count: suggestions.length,
      });

      return suggestions;
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
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SUGGESTIONS_REVIEW);
    if (!hasPermission) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(tErrors.insufficientPermissions);
    }

    try {
      return (await SuggestionRepository.searchSuggestions(query, excludeId)).map(result => ({
        id: result.id,
        parentId: "",
        submitterName: result.submitterName,
        body: result.body,
        status: result.status as SuggestionStatus,
        createdAt: result.createdAt,
        parentName: "",
      }));
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
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SUGGESTIONS_REVIEW);
    if (!hasPermission) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(tErrors.insufficientPermissions);
    }

    const suggestion = await SuggestionRepository.getSuggestionById(suggestionId);
    if (!suggestion) {
      throw new Error("suggestionNotFound");
    }

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
        // `parentProfile.email` is the parent's `users.email` (non-null in
        // `ParentProfileResult`). Stamp it on the email payload's `metadata.to`
        // so the email adapter has a valid recipient. Legacy direct-dispatch
        // path (F1 grandfather): `metadata.to` populated inline.
        await CommunicationService.dispatchMulti(
          [
            {
              userId: parentProfile.userId,
              title: "Suggestion Response",
              body: adminResponse,
              channel: "on_app",
              eventType: NotificationEventType.SUGGESTION_ACKNOWLEDGED,
            },
            {
              userId: parentProfile.userId,
              title: "Suggestion Response",
              body: adminResponse,
              channel: "email",
              eventType: NotificationEventType.SUGGESTION_ACKNOWLEDGED,
              metadata: { to: parentProfile.email, entityKind: "suggestion", entityId: suggestionId },
            },
          ],
          locale
        );
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
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SUGGESTIONS_REVIEW);
    if (!hasPermission) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(tErrors.insufficientPermissions);
    }

    if (suggestionId === duplicateOfId) {
      throw new Error("suggestion.cannotMarkSelfAsDuplicate");
    }

    const sourceSuggestion = await SuggestionRepository.getSuggestionById(suggestionId);
    if (!sourceSuggestion) {
      throw new Error("suggestion.notFound");
    }

    const targetSuggestion = await SuggestionRepository.getSuggestionById(duplicateOfId);
    if (!targetSuggestion) {
      throw new Error("suggestion.notFound");
    }

    if (targetSuggestion.status === SuggestionStatus.DUPLICATE) {
      throw new Error("suggestion.targetIsAlreadyDuplicate");
    }

    if (targetSuggestion.duplicateOfId === suggestionId) {
      throw new Error("suggestion.cannotCreateCircularDuplicate");
    }

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
        await CommunicationService.dispatch(
          {
            userId: parentProfile.userId,
            title: "Suggestion Marked as Duplicate",
            body: `Your suggestion has been marked as a duplicate of suggestion #${duplicateOfId.slice(0, 8)}`,
            channel: "on_app",
            eventType: NotificationEventType.SUGGESTION_DUPLICATE_MARKED,
          },
          locale
        );
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
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SUGGESTIONS_DELETE);
    if (!hasPermission) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(tErrors.insufficientPermissions);
    }

    const suggestion = await SuggestionRepository.getSuggestionById(suggestionId);
    if (!suggestion) {
      throw new Error("suggestionNotFound");
    }

    try {
      const result = await SoftDeleteRepository.softDeleteSuggestion(suggestionId, actorUserId);

      logger.info("Suggestion soft-deleted", {
        actorUserId,
        suggestionId,
        deletedAt: result.deletedAt,
      });

      return {
        deletedAt: result.deletedAt.toISOString(),
      };
    } catch (error) {
      logger.error("Failed to delete suggestion", { actorUserId, suggestionId, error });
      throw error;
    }
  }

  export async function getContributorStats(
    actorUserId: string,
    days: number,
    locale?: string
  ): Promise<SuggestionContributorStats> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.COMMUNICATION_SUBMIT_SUGGESTION
    );
    if (!hasPermission) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(tErrors.insufficientPermissions);
    }

    if (days < 1 || days > 365) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(tErrors.invalidInput);
    }

    try {
      const result = await SuggestionRepository.getContributorStats(days);

      logger.info("Suggestion contributor stats retrieved", {
        actorUserId,
        days,
        uniqueContributorCount: result.uniqueContributorCount,
      });

      return result;
    } catch (error) {
      logger.error("Failed to get suggestion contributor stats", { actorUserId, days, error });
      throw error;
    }
  }

  // ─── Bootstrap / Seeder Operations (no auth) ──────────────────────────────

  export async function createManySuggestions(
    inputs: Parameters<typeof SuggestionRepository.insertSuggestion>[0][]
  ): Promise<SuggestionSelectType[]> {
    const results: SuggestionSelectType[] = [];
    for (const input of inputs) {
      results.push(await SuggestionRepository.insertSuggestion(input));
    }
    return results;
  }
}
