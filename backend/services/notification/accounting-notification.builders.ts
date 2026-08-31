import { NotificationEventCategory, NotificationEventType } from "@/backend/enum";
import { fanOutToUsers } from "@/backend/services/notification/notification-payloads.builders";
import type { CommunicationPayload } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale/server-graphql";
import type { NotificationsLabels } from "@/shared/locale/types/notifications";

/**
 * Accounting (credit-hours) notification payload builders.
 *
 * Mirrors the shared skeleton used by the quota builders: empty-guard →
 * resolve localized labels → render title/body → assemble metadata →
 * fan out one payload per affected user.
 */
type BuilderInput = { readonly affectedUserIds: readonly string[]; readonly locale?: string };

function buildAccountingPayloads<B>(
  labels: (translations: NotificationsLabels) => {
    readonly title: string;
    readonly body: (params: B) => string;
  },
  bodyParams: B,
  eventType: NotificationEventType,
  category: NotificationEventCategory,
  input: BuilderInput
): CommunicationPayload[] {
  if (input.affectedUserIds.length === 0) return [];
  const labelSlice = labels(getServerTranslations(input.locale ?? "en").notificationsTranslations);
  const title = labelSlice.title;
  const body = labelSlice.body(bodyParams);

  return fanOutToUsers([...input.affectedUserIds], eventType, title, body, {
    category,
    ...bodyParams,
  });
}

/** Fired after a credit-hours payment is recorded (US-2 / AC#2). */
export function buildAccountingPaymentRecordedPayloads(
  input: BuilderInput & {
    readonly packageName: string;
    readonly creditHours: string;
    readonly amount: string;
    readonly currency: string;
  }
): CommunicationPayload[] {
  return buildAccountingPayloads(
    t => t.accountingPaymentRecorded,
    {
      packageName: input.packageName,
      creditHours: input.creditHours,
      amount: input.amount,
      currency: input.currency,
    },
    NotificationEventType.ACCOUNTING_PAYMENT_RECORDED,
    NotificationEventCategory.INFO,
    input
  );
}

/** Fired when the live balance dips to/below `accounting_low_hours_threshold`. */
export function buildAccountingLowHoursPayloads(
  input: BuilderInput & { readonly remaining: string; readonly threshold: string }
): CommunicationPayload[] {
  return buildAccountingPayloads(
    t => t.accountingLowHours,
    { remaining: input.remaining, threshold: input.threshold },
    NotificationEventType.ACCOUNTING_LOW_HOURS,
    NotificationEventCategory.REMINDER,
    input
  );
}
