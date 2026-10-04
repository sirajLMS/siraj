import { NotificationChannel, NotificationEventType } from "@/backend/enum";
import { WhatsappAccountPurpose } from "@/backend/enum/whatsapp/whatsapp-account.enum";
import type { CommunicationPayload, NotificationMetadata, WhatsappTemplateMetadata } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";
import type { NotificationsLabels } from "@/shared/locale/types/notifications";

/** Structured notification metadata plus channel-adapter bag fields (`to`, `data`, etc.). */
export type PayloadMetadata = NotificationMetadata & Record<string, unknown>;

const ALL_CHANNELS: readonly NotificationChannel[] = [
  NotificationChannel.ON_APP,
  NotificationChannel.EMAIL,
  NotificationChannel.SMS,
  NotificationChannel.PUSH,
  NotificationChannel.WHATSAPP,
] as const;

/**
 * Per-event canonical WhatsApp template mapping.
 *
 * Each entry maps a `NotificationEventType` to the approved Meta template name
 * and the ordered parameter names that the template body/header expects.
 * Payload builders use this to stamp
 * `metadata.whatsappTemplate: { name, languageCode, paramsOrder }` on WhatsApp
 * payloads so the dispatch layer can build the templated send.
 *
 * `languageCode` defaults to `null` so the dispatch layer MUST set it from the
 * recipient's locale — the pure builder has no I/O or locale dependency.
 *
 * Only utility events that Meta allows as business-initiated templates are
 * listed here. Events absent from this map will NOT emit a WhatsApp payload
 * even if `WHATSAPP` is in the event allowlist — the builder simply omits
 * `metadata.whatsappTemplate` and the dispatch layer skips the send.
 *
 * Builders are pure (no I/O) so they cannot check the per-user `whatsappEnabled`
 * flag. The opt-in gate is applied downstream in `dispatchWithPreferences`
 * → `dispatchForUser`, which already checks per-user channel preferences via
 * `NotificationPreferencesRepository`.
 */
export const NOTIFICATION_TEMPLATE_MAP: Readonly<
  Partial<
    Record<
      NotificationEventType,
      {
        readonly templateName: string;
        readonly paramsOrder: readonly string[];
        /** Routing purpose — the dispatch layer resolves the sending account by it (GENERAL fallback). */
        readonly purpose: WhatsappAccountPurpose;
      }
    >
  >
> = {
  [NotificationEventType.CLASS_REMINDER]: {
    templateName: "class_reminder_utility_v1",
    paramsOrder: ["studentName", "scheduledStartAt"],
    purpose: WhatsappAccountPurpose.STUDENTS,
  },
  [NotificationEventType.CLASS_ACTIVATED]: {
    templateName: "class_activated_utility_v1",
    paramsOrder: ["studentName", "scheduledStartAt"],
    purpose: WhatsappAccountPurpose.STUDENTS,
  },
  [NotificationEventType.LESSON_REPORT_SUBMITTED]: {
    templateName: "lesson_report_submitted_utility_v1",
    paramsOrder: ["reportId", "teacherName"],
    purpose: WhatsappAccountPurpose.STUDENTS,
  },
  [NotificationEventType.LESSON_REPORT_REVIEWED]: {
    templateName: "lesson_report_reviewed_utility_v1",
    paramsOrder: ["reportId", "teacherName", "decision"],
    purpose: WhatsappAccountPurpose.STUDENTS,
  },
  [NotificationEventType.INVOICE_GENERATED]: {
    templateName: "invoice_generated_utility_v1",
    paramsOrder: ["invoiceId", "amount", "currency"],
    purpose: WhatsappAccountPurpose.STUDENTS,
  },
};

/**
 * Default language code for WhatsApp templates.
 *
 * Set to `null` so the dispatch layer is FORCED to set `languageCode` from the
 * recipient's locale. The dispatch layer overrides this from the synced
 * template row's `languageCode` when available. Kept here so pure builders
 * have no I/O dependency.
 */
const DEFAULT_WHATSAPP_LANGUAGE_CODE: string | null = null;

export function labelsFor(locale: string | undefined): NotificationsLabels {
  return getServerTranslations(locale ?? "en").notificationsTranslations;
}

/**
 * Build one `CommunicationPayload` per channel for the given user/event.
 * `body` is shared across channels (channel adapters handle format
 * differences — see `CommunicationService.dispatch`).
 *
 * For WhatsApp payloads, `metadata.whatsappTemplate` is stamped from
 * `NOTIFICATION_TEMPLATE_MAP` so the dispatch layer can build the templated
 * send. Events without a template mapping get no `whatsappTemplate` — the
 * dispatch layer skips the send in that case.
 */
export function buildPerChannel(
  userId: string,
  eventType: NotificationEventType,
  title: string,
  body: string,
  metadata: Record<string, unknown>
): CommunicationPayload[] {
  if (!userId) return [];
  const payloads: CommunicationPayload[] = [];
  for (const channel of ALL_CHANNELS) {
    if (channel === NotificationChannel.WHATSAPP) {
      const templateDef = NOTIFICATION_TEMPLATE_MAP[eventType];
      if (!templateDef) continue; // no approved template for this event — skip WhatsApp
      if (!templateDef.paramsOrder || templateDef.paramsOrder.length === 0) {
        // Internal config error — NOTIFICATION_TEMPLATE_MAP misconfigured, not user-facing, no i18n needed
        throw new Error(`Missing template paramsOrder for event ${eventType}`);
      }
      payloads.push({
        userId,
        title,
        body,
        channel,
        eventType,
        metadata: {
          ...metadata,
          whatsappTemplate: {
            name: templateDef.templateName,
            languageCode: DEFAULT_WHATSAPP_LANGUAGE_CODE,
            paramsOrder: templateDef.paramsOrder,
            purpose: templateDef.purpose,
          } satisfies WhatsappTemplateMetadata,
        },
      });
    } else {
      payloads.push({ userId, title, body, channel, eventType, metadata });
    }
  }
  return payloads;
}
