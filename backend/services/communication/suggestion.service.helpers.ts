import { createHash } from "node:crypto";
import { SuggestionRepository } from "@/backend/db/repo/parents";
import { UserRepository } from "@/backend/db/repo/users";
import { NotificationChannel, NotificationEventType, SuggestionStatus } from "@/backend/enum";
import { NotFoundError, ValidationError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { CommunicationService } from "@/backend/services/communication/communication.service";
import type { SuggestionReturnType, SuggestionSearchResultType, SuggestionSelectType } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

type SuggestionDetailRow = NonNullable<Awaited<ReturnType<typeof SuggestionRepository.getSuggestionById>>>;
type AdminSuggestionQueueRow = Awaited<ReturnType<typeof SuggestionRepository.getAdminSuggestionQueue>>["rows"][number];
type SuggestionSearchRow = Awaited<ReturnType<typeof SuggestionRepository.searchSuggestions>>[number];

function isSuggestionStatus(value: string): value is SuggestionStatus {
  return (Object.values(SuggestionStatus) as readonly string[]).includes(value);
}

export function anonymizeContributorId(rawUserId: string): string {
  return createHash("sha256").update(rawUserId).digest("hex").slice(0, 12);
}

export function anonymizeContributorName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.map(part => `${part.charAt(0).toUpperCase()}.`).join(" ");
}

export function normalizeSuggestion(suggestion: SuggestionReturnType): SuggestionReturnType {
  return {
    ...suggestion,
    parentName: suggestion.parentName ?? null,
    reviewedByUserName: suggestion.reviewedByUserName ?? null,
    duplicateOfBody: suggestion.duplicateOfBody ?? null,
    duplicateOfSubmitterName: suggestion.duplicateOfSubmitterName ?? null,
    responseCount: suggestion.responseCount ?? 0,
  };
}

export function mapSuggestionSelectToReturn(result: SuggestionSelectType): SuggestionReturnType {
  return normalizeSuggestion({
    id: result.id,
    parentId: result.parentId,
    submitterName: result.submitterName,
    body: result.body,
    status: isSuggestionStatus(result.status) ? result.status : SuggestionStatus.PENDING,
    duplicateOfId: result.duplicateOfId ?? null,
    adminResponse: result.adminResponse ?? null,
    reviewedByUserId: result.reviewedByUserId ?? null,
    reviewedAt: result.reviewedAt ?? null,
    emailSentAt: result.emailSentAt ?? null,
    createdAt: result.createdAt,
    parentName: "",
    reviewedByUserName: null,
    duplicateOfBody: null,
    duplicateOfSubmitterName: null,
    responseCount: 0,
  });
}

export function mapAdminSuggestionRow(row: AdminSuggestionQueueRow): SuggestionReturnType {
  return {
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
  };
}

export function mapSuggestionSearchResult(result: SuggestionSearchRow): SuggestionSearchResultType {
  return {
    id: result.id,
    parentId: "",
    submitterName: result.submitterName,
    body: result.body,
    status: isSuggestionStatus(result.status) ? result.status : SuggestionStatus.PENDING,
    createdAt: result.createdAt,
    parentName: "",
  };
}

/**
 * Dispatches the submitter email for a newly created suggestion. Resolves the
 * recipient from the submitter's `users` row (legacy direct-dispatch path, where
 * `metadata.to` is stamped inline) and skips dispatch when no email exists.
 */
export async function notifySuggestionSubmitted(
  created: SuggestionSelectType,
  actorUserId: string,
  locale?: string
): Promise<void> {
  const submitter = await UserRepository.findSafeById(actorUserId);
  const to = submitter?.email;
  if (!to) {
    logger.warn("Suggestion email dispatch skipped: submitter has no email", {
      actorUserId,
      suggestionId: created.id,
    });
    return;
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
}

/** Notifies a suggestion's parent on both on-app and email channels that it was answered. */
export async function dispatchSuggestionResponse(
  parentProfile: { userId: string; email: string },
  adminResponse: string,
  suggestionId: string,
  locale?: string
): Promise<void> {
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

/** Notifies a suggestion's parent that their suggestion was marked as a duplicate. */
export async function dispatchSuggestionMarkedDuplicate(
  userId: string,
  duplicateOfId: string,
  locale?: string
): Promise<void> {
  const tNotifications = getServerTranslations(locale ?? "en").notificationsTranslations;
  await CommunicationService.dispatch(
    {
      userId,
      title: tNotifications.suggestionMarkedDuplicate.title,
      body: tNotifications.suggestionMarkedDuplicate.body({ duplicateId: duplicateOfId }),
      channel: NotificationChannel.ON_APP,
      eventType: NotificationEventType.SUGGESTION_DUPLICATE_MARKED,
    },
    locale
  );
}

/**
 * Validates the source/target pair for a duplicate-marking request and returns
 * the source suggestion row. Rejects self-references, missing suggestions,
 * duplicate targets, and circular duplicate chains.
 */
export async function resolveDuplicateTarget(
  suggestionId: string,
  duplicateOfId: string,
  locale?: string
): Promise<SuggestionDetailRow> {
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

  return sourceSuggestion;
}
