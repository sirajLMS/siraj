import { ParentRepository, SuggestionRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { CommunicationService } from "@/backend/services/communication/communication.service";
import type {
  AdminSuggestionResultType,
  SubmitSuggestionInputType,
  SuggestionSelectType,
} from "@/backend/types/communications.types";
import { AppPermission, NotificationEventType } from "@/shared/lib/enum";

interface AdminSuggestionOptions {
  readonly limit: number;
  readonly offset: number;
  readonly status?: string | null;
  readonly search?: string | null;
}

export namespace SuggestionService {
  export async function submitSuggestion(
    actorUserId: string,
    input: SubmitSuggestionInputType,
    locale?: string
  ): Promise<SuggestionSelectType> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.COMMUNICATION_SUBMIT_SUGGESTION
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const parent = await ParentRepository.findByUserId(actorUserId);
    if (!parent) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("parentNotFound", { userId: actorUserId }));
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

      await CommunicationService.dispatch(
        {
          userId: actorUserId,
          title: "New Suggestion Submitted",
          body: created.body,
          channel: "email",
          eventType: NotificationEventType.NEW_SUGGESTION,
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
    options: AdminSuggestionOptions,
    locale?: string
  ): Promise<AdminSuggestionResultType> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.COMPLAINTS_LIST);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    try {
      const result = await SuggestionRepository.getSuggestionsForAdmin({
        limit: options.limit,
        offset: options.offset,
        status: options.status ?? null,
        search: options.search ?? null,
      });

      return {
        suggestions: result.rows,
        totalCount: result.totalCount,
        pendingCount: 0,
        reviewedCount: 0,
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
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.COMPLAINTS_LIST);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    try {
      const updated = await SuggestionRepository.markSuggestionReviewed(suggestionId, undefined, locale);

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
}
