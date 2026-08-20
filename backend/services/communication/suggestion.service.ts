import { ParentRepository, SuggestionRepository } from "@/backend/db/repo/parents";
import { SoftDeleteRepository } from "@/backend/db/repo/shared";
import { UserRepository } from "@/backend/db/repo/users";
import { AppPermission, NotificationChannel, NotificationEventType, SuggestionStatus } from "@/backend/enum";
import { NotFoundError, ValidationError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import {
  assertPermission,
  requireParentByActorUserId,
  resolveEntityById,
  softDeleteEntityLog,
} from "@/backend/services/communication/__shared__/complaintSuggestionBase";
import { CommunicationService } from "@/backend/services/communication/communication.service";
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

function isSuggestionStatus(value: string): value is SuggestionStatus {
  return (Object.values(SuggestionStatus) as readonly string[]).includes(value);
}

export namespace SuggestionService {
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

      // Resolve the submitter's email so the email adapter has a valid `to`.
      // `parent` (from `findByUserId`) is the `parents` row — email lives on
      // `users`, so fetch via `UserRepository.findSafeById`. Legacy direct-
      // dispatch path (F1 grandfather): `metadata.to` populated inline.
      const submitter = await UserRepository.findSafeById(actorUserId);
      const to = submitter?.email;
      if (!to) {
        logger.warn("Suggestion email dispatch skipped: submitter has no email", {
          actorUserId,
          suggestionId: created.id,
        });
        return created;
      }
      const tNotifications = getServerTranslations(locale ?? "en").notificationsTranslations;
      await CommunicationService.dispatch(
        {
          userId: actorUserId,
          title: tNotifications.newSuggestion.title,
          body: created.body,
          channel: NotificationChannel.EMAIL,
          eventType: NotificationEventType.NEW_SUGGESTION,
          metadata: { to, entityKind: "suggestion", entityId: created.id },
        },
        locale
      );

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
        suggestions: result.rows.map(row => ({
          id: row.id,
          parentId: row.parentId,
          parentUserId: row.parentUserId,
          submitterName: row.submitterName,
          body: row.body,
          status: isSuggestionStatus(row.status) ? row.status : SuggestionStatus.PENDING,
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
        const isTestServer = process.env.TEST_SERVER === "1";
        const logFn = isTestServer
          ? (msg: string, ctx?: Record<string, unknown>) => logger.debug(msg, ctx)
          : (msg: string, ctx?: Record<string, unknown>) => logger.warn(msg, ctx);
        logFn("Failed to mark suggestion as reviewed (not found)", { actorUserId, suggestionId, error });
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
    await assertPermission(actorUserId, AppPermission.SUGGESTIONS_REVIEW, locale);

    try {
      return (await SuggestionRepository.searchSuggestions(query, excludeId)).map(result => ({
        id: result.id,
        parentId: "",
        submitterName: result.submitterName,
        body: result.body,
        status: isSuggestionStatus(result.status) ? result.status : SuggestionStatus.PENDING,
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
        // `parentProfile.email` is the parent's `users.email` (non-null in
        // `ParentProfileResult`). Stamp it on the email payload's `metadata.to`
        // so the email adapter has a valid recipient. Legacy direct-dispatch
        // path (F1 grandfather): `metadata.to` populated inline.
        const tNotifications = getServerTranslations(locale ?? "en").notificationsTranslations;
        await CommunicationService.dispatchMulti(
          [
            {
              userId: parentProfile.userId,
              title: tNotifications.suggestionResponse.title,
              body: adminResponse,
              channel: NotificationChannel.ON_APP,
              eventType: NotificationEventType.SUGGESTION_ACKNOWLEDGED,
            },
            {
              userId: parentProfile.userId,
              title: tNotifications.suggestionResponse.title,
              body: adminResponse,
              channel: NotificationChannel.EMAIL,
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
    await assertPermission(actorUserId, AppPermission.SUGGESTIONS_REVIEW, locale);
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;

    if (suggestionId === duplicateOfId) {
      throw new ValidationError("SELF_REFERENCE", tErrors.suggestionCannotMarkSelfAsDuplicate);
    }

    const sourceSuggestion = await SuggestionRepository.getSuggestionById(suggestionId);
    if (!sourceSuggestion) {
      throw new NotFoundError("SUGGESTION", tErrors.suggestionNotFound);
    }

    const targetSuggestion = await SuggestionRepository.getSuggestionById(duplicateOfId);
    if (!targetSuggestion) {
      throw new NotFoundError("SUGGESTION", tErrors.suggestionNotFound);
    }

    if (targetSuggestion.status === "DUPLICATE") {
      throw new ValidationError("DUPLICATE_TARGET", tErrors.suggestionTargetIsAlreadyDuplicate);
    }

    if (targetSuggestion.duplicateOfId === suggestionId) {
      throw new ValidationError("CIRCULAR_DUPLICATE", tErrors.suggestionCircularDuplicate);
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
        const tNotifications = getServerTranslations(locale ?? "en").notificationsTranslations;
        await CommunicationService.dispatch(
          {
            userId: parentProfile.userId,
            title: tNotifications.suggestionMarkedDuplicate.title,
            body: tNotifications.suggestionMarkedDuplicate.body({ duplicateId: duplicateOfId }),
            channel: NotificationChannel.ON_APP,
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
    return Promise.all(inputs.map(input => SuggestionRepository.insertSuggestion(input)));
  }
}
