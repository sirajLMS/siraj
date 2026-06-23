import { ParentRepository, SuggestionRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { CommunicationService } from "@/backend/services/communication/communication.service";
import { AppPermission, NotificationEventType } from "@/shared/lib/enum";

export interface SubmitSuggestionInput {
  readonly submitterName: string;
  readonly body: string;
}

export interface SuggestionResult {
  readonly id: string;
  readonly parentId: string;
  readonly submitterName: string;
  readonly body: string;
  readonly emailSentAt: Date | null;
  readonly createdAt: Date;
}

export interface AdminSuggestionOptions {
  readonly limit: number;
  readonly offset: number;
  readonly status?: string | null;
  readonly search?: string | null;
}

export interface AdminSuggestionsResult {
  readonly suggestions: ReadonlyArray<SuggestionResult>;
  readonly totalCount: number;
}

export namespace SuggestionService {
  export async function submitSuggestion(
    actorUserId: string,
    input: SubmitSuggestionInput,
    locale?: string
  ): Promise<SuggestionResult> {
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

      return {
        id: created.id,
        parentId: created.parentId,
        submitterName: created.submitterName,
        body: created.body,
        emailSentAt: created.emailSentAt ?? null,
        createdAt: created.createdAt,
      };
    } catch (error) {
      logger.error("Failed to submit suggestion", { actorUserId, error });
      throw error;
    }
  }

  export async function getAdminSuggestions(
    actorUserId: string,
    options: AdminSuggestionOptions,
    locale?: string
  ): Promise<AdminSuggestionsResult> {
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
        suggestions: result.rows.map(s => ({
          id: s.id,
          parentId: s.parentId,
          submitterName: s.submitterName,
          body: s.body,
          emailSentAt: s.emailSentAt ?? null,
          createdAt: s.createdAt,
        })),
        totalCount: result.totalCount,
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
  ): Promise<SuggestionResult> {
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

      return {
        id: updated.id,
        parentId: updated.parentId,
        submitterName: updated.submitterName,
        body: updated.body,
        emailSentAt: updated.emailSentAt ?? null,
        createdAt: updated.createdAt,
      };
    } catch (error) {
      logger.error("Failed to mark suggestion as reviewed", { actorUserId, suggestionId, error });
      throw error;
    }
  }
}
