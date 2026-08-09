import { NotificationEventCategory, NotificationEventType } from "@/backend/enum";
import { fanOutToUsers } from "@/backend/services/notification/notification-payloads.builders";
import type { CommunicationPayload } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";
import type { NotificationsLabels } from "@/shared/locale/notifications";

/**
 * Shared skeleton for the seven quota/on-demand notification builders.
 * Encapsulates the common shape — empty-guard → resolve localized labels →
 * render title/body → assemble metadata → fan out — so each public builder
 * only supplies its label selector, body params, eventType, and metadata
 * category. Eliminates the line-for-line duplication flagged by CodeScene
 * (DUP-3): the seven builders were identical except for the label key,
 * eventType, body params, and `category` tag.
 *
 * @param labels    A function that picks the correct `*Labels` slice from
 *                  `NotificationsLabels` (e.g. `l => l.quotaExpiringSoon`).
 * @param bodyParams  The params object passed to `labels.body(...)`.
 * @param eventType The `NotificationEventType` for this event.
 * @param category  The `NotificationEventCategory` tag (info/reminder/urgent/digest).
 * @param input      The builder input containing `affectedUserIds` and `locale`.
 */
function buildQuotaPayloads<B>(
  labels: (translations: NotificationsLabels) => { readonly title: string; readonly body: (p: B) => string },
  bodyParams: B,
  eventType: NotificationEventType,
  category: NotificationEventCategory,
  input: { affectedUserIds: string[]; locale?: string }
): CommunicationPayload[] {
  if (input.affectedUserIds.length === 0) return [];
  const labelSlice = labels(getServerTranslations(input.locale ?? "en").notificationsTranslations);
  const title = labelSlice.title;
  const body = labelSlice.body(bodyParams);

  return fanOutToUsers(input.affectedUserIds, eventType, title, body, {
    category,
    ...bodyParams,
  });
}

export function buildQuotaExpiringSoonPayloads(input: {
  affectedUserIds: string[];
  quotaName: string;
  validUntil: string;
  remaining: number;
  locale?: string;
}): CommunicationPayload[] {
  return buildQuotaPayloads(
    t => t.quotaExpiringSoon,
    { quotaName: input.quotaName, validUntil: input.validUntil, remaining: input.remaining },
    NotificationEventType.QUOTA_EXPIRING_SOON,
    NotificationEventCategory.REMINDER,
    input
  );
}

export function buildQuotaExpiredPayloads(input: {
  affectedUserIds: string[];
  quotaName: string;
  locale?: string;
}): CommunicationPayload[] {
  return buildQuotaPayloads(
    t => t.quotaExpired,
    { quotaName: input.quotaName },
    NotificationEventType.QUOTA_EXPIRED,
    NotificationEventCategory.INFO,
    input
  );
}

export function buildQuotaLowBalancePayloads(input: {
  affectedUserIds: string[];
  studentName: string;
  remaining: number;
  totalClasses: number;
  locale?: string;
}): CommunicationPayload[] {
  return buildQuotaPayloads(
    t => t.quotaLowBalance,
    { studentName: input.studentName, remaining: input.remaining, totalClasses: input.totalClasses },
    NotificationEventType.QUOTA_LOW_BALANCE,
    NotificationEventCategory.REMINDER,
    input
  );
}

type OndemandInstanceInput = {
  affectedUserIds: string[];
  studentName: string;
  scheduledStartAt: string;
  locale?: string;
};

function buildOndemandInstancePayloads(
  labels: (translations: NotificationsLabels) => { readonly title: string; readonly body: (p: { studentName: string; scheduledStartAt: string }) => string },
  eventType: NotificationEventType,
  category: NotificationEventCategory,
  input: OndemandInstanceInput
): CommunicationPayload[] {
  return buildQuotaPayloads(
    labels,
    { studentName: input.studentName, scheduledStartAt: input.scheduledStartAt },
    eventType,
    category,
    input
  );
}

export function buildOndemandInstancePendingCreditPayloads(input: OndemandInstanceInput): CommunicationPayload[] {
  return buildOndemandInstancePayloads(
    t => t.onDemandInstancePendingCredit,
    NotificationEventType.ON_DEMAND_INSTANCE_PENDING_CREDIT,
    NotificationEventCategory.URGENT,
    input
  );
}

export function buildOndemandInstanceReminderT3Payloads(input: OndemandInstanceInput): CommunicationPayload[] {
  return buildOndemandInstancePayloads(
    t => t.onDemandInstanceReminderT3,
    NotificationEventType.ON_DEMAND_INSTANCE_REMINDER_T3,
    NotificationEventCategory.REMINDER,
    input
  );
}

export function buildOndemandInstanceReminderT1Payloads(input: OndemandInstanceInput): CommunicationPayload[] {
  return buildOndemandInstancePayloads(
    t => t.onDemandInstanceReminderT1,
    NotificationEventType.ON_DEMAND_INSTANCE_REMINDER_T1,
    NotificationEventCategory.URGENT,
    input
  );
}

export function buildOndemandTeacherDailyDigestPayloads(input: {
  affectedUserIds: string[];
  teacherName: string;
  pendingCount: number;
  locale?: string;
}): CommunicationPayload[] {
  return buildQuotaPayloads(
    t => t.onDemandTeacherDailyDigest,
    { teacherName: input.teacherName, pendingCount: input.pendingCount },
    NotificationEventType.ON_DEMAND_TEACHER_DAILY_DIGEST,
    NotificationEventCategory.DIGEST,
    input
  );
}
