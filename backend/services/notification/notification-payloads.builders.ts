/**
 * Pure notification payload builders — the SOLE producer of `CommunicationPayload`
 * objects in the codebase. Domain services call these builders and hand the
 * resulting array to `dispatchWithPreferences`.
 *
 * Contract:
 *   - PURE: no I/O, no logger, no side-effects. The only "external" call is
 *     `getServerTranslations(locale)` — a synchronous lookup against the
 *     compile-time i18n registry in `@/shared/locale`, which is safe.
 *   - LOCALIZED: every title/body flows through the `notifications` namespace
 *     in `shared/locale/notifications/`. NO hardcoded English literals
 *     No hardcoded English literals.
 *   - IDEMPOTENT: same inputs -> same outputs.
 *   - ALL FIVE CHANNELS: every builder emits one payload per channel
 *     (`on_app`, `email`, `sms`, `push`, `whatsapp`). Channel filtering by user prefs +
 *     event allowlist happens in `dispatchWithPreferences`.
 *
 * Fan-out strategy: each builder accepts `affectedUserIds[]` and emits
 * up to `5 * affectedUserIds.length` payloads, one per (user, channel). Callers
 * pass the SAME `affectedUserIds` to `dispatchWithPreferences` so prefs are
 * applied per user. For single-recipient events (invoice, payment-method)
 * pass a one-element array. WhatsApp payloads are only emitted for events
 * that have a template in `NOTIFICATION_TEMPLATE_MAP` (B1).
 */

import { NotificationChannel, NotificationEventType } from "@/backend/enum";
import type {
  ClassInstanceSelectType,
  CommunicationPayload,
  InvoiceSelectType,
  NotificationMetadata,
  WhatsappTemplateMetadata,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale/server-graphql";
import type {
  ClassLifecycleBodyParams,
  NotificationsLabels,
  StudentTeacherReassignmentRecipient,
} from "@/shared/locale/types/notifications";

/** Structured notification metadata plus channel-adapter bag fields (`to`, `data`, etc.). */
type PayloadMetadata = NotificationMetadata & Record<string, unknown>;

// ─── Helpers ───────────────────────────────────────────────────────────

const VALID_REASSIGNMENT_RECIPIENTS: ReadonlySet<string> = new Set(["parent", "oldTeacher", "newTeacher"]);

function isStudentTeacherReassignmentRecipient(value: unknown): value is StudentTeacherReassignmentRecipient {
  return typeof value === "string" && VALID_REASSIGNMENT_RECIPIENTS.has(value);
}

/**
 * Maps `NotificationChannel` enum members to their lowercase string identifiers
 * used in channel comparison and routing. WhatsApp joins the existing four.
 * Exported for downstream consumers (dispatch helpers, tests).
 */
export const CHANNEL_FROM_ENUM: Readonly<Record<NotificationChannel, string>> = Object.freeze({
  [NotificationChannel.ON_APP]: "on_app",
  [NotificationChannel.EMAIL]: "email",
  [NotificationChannel.SMS]: "sms",
  [NotificationChannel.PUSH]: "push",
  [NotificationChannel.WHATSAPP]: "whatsapp",
});

export const ALL_CHANNELS: readonly NotificationChannel[] = [
  NotificationChannel.ON_APP,
  NotificationChannel.EMAIL,
  NotificationChannel.SMS,
  NotificationChannel.PUSH,
  NotificationChannel.WHATSAPP,
] as const;

/**
 * Per-event canonical WhatsApp template mapping (B1).
 *
 * Each entry maps a `NotificationEventType` to the approved Meta template name
 * and the ordered parameter names that the template body/header expects.
 * `notification-payloads.builders` uses this to stamp
 * `metadata.whatsappTemplate: { name, languageCode, paramsOrder }` on WhatsApp
 * payloads so `dispatchWhatsapp` (6.3) can build the templated send.
 *
 * `languageCode` defaults to `null` so the dispatch layer MUST set it from the
 * recipient's locale — the pure builder has no I/O or locale dependency (r7-020).
 *
 * Only utility events that Meta allows as business-initiated templates are
 * listed here.  Events absent from this map will NOT emit a WhatsApp payload
 * even if `WHATSAPP` is in the event allowlist — the builder simply omits
 * `metadata.whatsappTemplate` and the dispatch layer skips the send.
 *
 * REQ-10 / BL1 — Per-user opt-in gate:
 * Builders are pure (no I/O) so they cannot check the per-user `whatsappEnabled`
 * flag.  The opt-in gate is applied downstream in `dispatchWithPreferences`
 * → `dispatchForUser`, which already checks per-user channel preferences via
 * `NotificationPreferencesRepository`.  When Task 29 adds the dedicated
 * `whatsappEnabled` column, `dispatchForUser` will also check it there.
 * Until then, the existing channel-preference gate serves as the opt-in:
 * a user with WhatsApp disabled in their prefs will not receive WhatsApp
 * payloads.
 */
export const NOTIFICATION_TEMPLATE_MAP: Readonly<
  Partial<Record<NotificationEventType, { readonly templateName: string; readonly paramsOrder: readonly string[] }>>
> = {
  [NotificationEventType.CLASS_REMINDER]: {
    templateName: "class_reminder_utility_v1",
    paramsOrder: ["studentName", "scheduledStartAt"],
  },
  [NotificationEventType.CLASS_ACTIVATED]: {
    templateName: "class_activated_utility_v1",
    paramsOrder: ["studentName", "scheduledStartAt"],
  },
  [NotificationEventType.LESSON_REPORT_SUBMITTED]: {
    templateName: "lesson_report_submitted_utility_v1",
    paramsOrder: ["reportId", "teacherName"],
  },
  [NotificationEventType.LESSON_REPORT_REVIEWED]: {
    templateName: "lesson_report_reviewed_utility_v1",
    paramsOrder: ["reportId", "teacherName", "decision"],
  },
  [NotificationEventType.INVOICE_GENERATED]: {
    templateName: "invoice_generated_utility_v1",
    paramsOrder: ["invoiceId", "amount", "currency"],
  },
};

/**
 * Default language code for WhatsApp templates.
 *
 * Set to `null` so the dispatch layer is FORCED to set `languageCode` from the
 * recipient's locale. The dispatch layer (6.3) overrides this from the synced
 * template row's `languageCode` when available (B6). Kept here so pure builders
 * have no I/O dependency.
 *
 * r7-020: Previously hardcoded to `"en"`, which caused Arabic-locale recipients
 * to receive English templates because the dispatch layer never overrode it.
 */
const DEFAULT_WHATSAPP_LANGUAGE_CODE: string | null = null;

function labelsFor(locale: string | undefined): NotificationsLabels {
  return getServerTranslations(locale ?? "en").notificationsTranslations;
}

/**
 * Build one `CommunicationPayload` per channel for the given user/event.
 * `body` is shared across channels (channel adapters handle format
 * differences — see `CommunicationService.dispatch`).
 *
 * For WhatsApp payloads, `metadata.whatsappTemplate` is stamped from
 * `NOTIFICATION_TEMPLATE_MAP` (B1) so `dispatchWhatsapp` (6.3) can build
 * the templated send. Events without a template mapping get no
 * `whatsappTemplate` — the dispatch layer skips the send in that case.
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
          } satisfies WhatsappTemplateMetadata,
        },
      });
    } else {
      payloads.push({ userId, title, body, channel, eventType, metadata });
    }
  }
  return payloads;
}

/**
 * Fan out a single rendered `{ title, body }` to every affected user across
 * all four channels. Shared by the multi-recipient lifecycle builders
 * (class, student, lesson-report-submitted, new-complaint) so the
 * `for (const userId of affectedUserIds) { ... buildPerChannel(...) }`
 * shape lives in exactly one place.
 */
export function fanOutToUsers(
  affectedUserIds: readonly string[],
  eventType: NotificationEventType,
  title: string,
  body: string,
  sharedMetadata: Record<string, unknown>
): CommunicationPayload[] {
  const payloads: CommunicationPayload[] = [];
  for (const userId of affectedUserIds) {
    payloads.push(...buildPerChannel(userId, eventType, title, body, sharedMetadata));
  }
  return payloads;
}

function classBodyParams(classInstance: ClassInstanceSelectType, studentName: string): ClassLifecycleBodyParams {
  return {
    studentName,
    scheduledStartAt: classInstance.scheduledStartAt.toISOString(),
  };
}

/**
 * Shared skeleton for the class/student lifecycle builders. Encapsulates the
 * common shape — empty-guard → event-set guard → render → assemble metadata →
 * fan out — so each domain builder only supplies its render callback, event
 * set, and base metadata. Eliminates the CodeScene Code Duplication between
 * `buildClassLifecyclePayloads` and `buildStudentLifecyclePayloads`.
 */
function buildLifecyclePayloads(
  affectedUserIds: string[],
  eventType: NotificationEventType,
  allowedEvents: ReadonlySet<NotificationEventType>,
  locale: string | undefined,
  metadata: Record<string, string> | undefined,
  baseMetadata: PayloadMetadata,
  render: (labels: NotificationsLabels) => { title: string; body: string } | null
): CommunicationPayload[] {
  if (affectedUserIds.length === 0) return [];
  if (!allowedEvents.has(eventType)) return [];

  const labels = labelsFor(locale);
  const rendered = render(labels);
  if (!rendered) return [];
  const { title, body } = rendered;

  const sharedMetadata: PayloadMetadata = {
    ...baseMetadata,
    totalRecipients: affectedUserIds.length,
    ...metadata,
  };

  return fanOutToUsers(affectedUserIds, eventType, title, body, sharedMetadata);
}

function formatInvoiceAmount(invoice: InvoiceSelectType): { amount: string; currency: string } {
  return {
    amount: invoice.amount,
    currency: invoice.currency,
  };
}

/**
 * Resolve a class-lifecycle event to a localized `{ title, body }` pair.
 * Returns `null` if the `eventType` is not one of the 10 CLASS_* lifecycle
 * events — callers must early-return on `null`.
 *
 * Pure helper — pulled out so the dispatch `switch` can return `{ title, body }`
 * directly (TS narrows cleanly when each `case` returns rather than mutating
 * outer `let`s).
 */
function renderClassLifecycle(
  labels: NotificationsLabels,
  eventType: NotificationEventType,
  baseParams: ClassLifecycleBodyParams,
  metadata: Record<string, string> | undefined
): { title: string; body: string } | null {
  switch (eventType) {
    case NotificationEventType.CLASS_SCHEDULED:
      return { title: labels.classScheduled.title, body: labels.classScheduled.body(baseParams) };
    case NotificationEventType.CLASS_ACTIVATED:
      return { title: labels.classActivated.title, body: labels.classActivated.body(baseParams) };
    case NotificationEventType.CLASS_STARTED:
      return { title: labels.classStarted.title, body: labels.classStarted.body(baseParams) };
    case NotificationEventType.CLASS_COMPLETED:
      return { title: labels.classCompleted.title, body: labels.classCompleted.body(baseParams) };
    case NotificationEventType.CLASS_MARKED_ABSENT:
      return { title: labels.classMarkedAbsent.title, body: labels.classMarkedAbsent.body(baseParams) };
    case NotificationEventType.CLASS_MARKED_MISSED:
      return { title: labels.classMarkedMissed.title, body: labels.classMarkedMissed.body(baseParams) };
    case NotificationEventType.CLASS_LEAVE_REQUESTED:
      return { title: labels.classLeaveRequested.title, body: labels.classLeaveRequested.body(baseParams) };
    case NotificationEventType.CLASS_RESCHEDULED: {
      const newStartAt = metadata?.newStartAt ?? baseParams.scheduledStartAt;
      return {
        title: labels.classRescheduled.title,
        body: labels.classRescheduled.body({ ...baseParams, newStartAt }),
      };
    }
    case NotificationEventType.CLASS_CANCELLED:
      return { title: labels.classCancelled.title, body: labels.classCancelled.body(baseParams) };
    case NotificationEventType.CLASS_RESET:
      return { title: labels.classReset.title, body: labels.classReset.body(baseParams) };
    default:
      return null;
  }
}

/**
 * Resolve a student-lifecycle event to a localized `{ title, body }` pair.
 * Returns `null` if the `eventType` is not one of the 3 STUDENT_* lifecycle
 * events.
 */
function renderStudentLifecycle(
  labels: NotificationsLabels,
  eventType: NotificationEventType,
  studentName: string,
  metadata: Record<string, string> | undefined
): { title: string; body: string } | null {
  switch (eventType) {
    case NotificationEventType.STUDENT_TEACHER_REASSIGNED: {
      const rawRecipient = metadata?.recipient;
      const safeRecipient: StudentTeacherReassignmentRecipient = isStudentTeacherReassignmentRecipient(rawRecipient)
        ? rawRecipient
        : "parent";
      const variants = labels.studentTeacherReassigned;
      if (safeRecipient === "newTeacher") {
        const variant = variants.newTeacher;
        return {
          title: variant.title,
          body: variant.body({ studentName, oldTeacherName: metadata?.oldTeacherName ?? "—" }),
        };
      }
      if (safeRecipient === "oldTeacher") {
        const variant = variants.oldTeacher;
        return {
          title: variant.title,
          body: variant.body({ studentName, newTeacherName: metadata?.newTeacherName ?? "—" }),
        };
      }
      const variant = variants.parent;
      return {
        title: variant.title,
        body: variant.body({ studentName, newTeacherName: metadata?.newTeacherName ?? "—" }),
      };
    }
    case NotificationEventType.STUDENT_STATUS_CHANGED:
      return {
        title: labels.studentStatusChanged.title,
        body: labels.studentStatusChanged.body({
          studentName,
          oldStatus: metadata?.oldStatus ?? "—",
          newStatus: metadata?.newStatus ?? "—",
        }),
      };
    case NotificationEventType.STUDENT_QUOTA_OVERRIDDEN:
      return {
        title: labels.studentQuotaOverridden.title,
        body: labels.studentQuotaOverridden.body({
          studentName,
          newClassesRemaining: Number(metadata?.newClassesRemaining ?? 0),
        }),
      };
    default:
      return null;
  }
}

export {
  buildAccountingLowHoursPayloads,
  buildAccountingPaymentRecordedPayloads,
} from "@/backend/services/notification/accounting-notification.builders";
// ─── Quota & on-demand event builder registry ─────────────────────────
//
// The quota/on-demand notification builders live in `quota-notification.builders.ts`
// to keep the pure three-arg thousand-line file from growing further. They are
// re-exported here so every notification builder shares a single import surface
// (`notification-payloads.builders`) — resolving task 11.4 "register new builders".
export {
  buildOndemandInstancePendingCreditPayloads,
  buildOndemandInstanceReminderT1Payloads,
  buildOndemandInstanceReminderT3Payloads,
  buildOndemandTeacherDailyDigestPayloads,
  buildQuotaExpiredPayloads,
  buildQuotaExpiringSoonPayloads,
  buildQuotaLowBalancePayloads,
} from "@/backend/services/notification/quota-notification.builders";

// ─── Invoice event builders ───────────────────────────────────────────

/**
 * Build payloads for `INVOICE_GENERATED`.
 *
 * @param parentUserId  The parent user receiving the notification.
 * @param invoice       The freshly-generated invoice row.
 * @param locale        Optional locale code (defaults to "en").
 * @returns `CommunicationPayload[]` — one entry per channel (4 total).
 *          Returns `[]` if `parentUserId` is empty.
 */
export function buildInvoiceGeneratedPayloads(
  parentUserId: string,
  invoice: InvoiceSelectType,
  locale?: string
): CommunicationPayload[] {
  if (!parentUserId) return [];
  const labels = labelsFor(locale).invoiceGenerated;
  const { amount, currency } = formatInvoiceAmount(invoice);
  const body = labels.body({ invoiceId: invoice.id, amount, currency });
  return buildPerChannel(parentUserId, NotificationEventType.INVOICE_GENERATED, labels.title, body, {
    entityKind: "invoice",
    entityId: invoice.id,
    amount,
    currency,
    invoiceId: invoice.id,
  });
}

/**
 * Build payloads for `INVOICE_STATUS_CHANGED` keyed by `action`.
 *
 * @param parentUserId  The parent user receiving the notification.
 * @param action        Which status transition triggered the event.
 * @param invoice       The invoice whose status changed.
 * @param locale        Optional locale code.
 * @returns One `CommunicationPayload[]` of length up to 5 (one per channel; WhatsApp only when a template exists).
 */
export function buildInvoiceStatusChangedPayloads(
  parentUserId: string,
  action: "proofSubmitted" | "proofApproved" | "proofRejected" | "markedPaid",
  invoice: InvoiceSelectType,
  locale?: string
): CommunicationPayload[] {
  if (!parentUserId) return [];
  const labels = labelsFor(locale).invoiceStatusChanged[action];
  const { amount, currency } = formatInvoiceAmount(invoice);
  const body = labels.body({ invoiceId: invoice.id });
  return buildPerChannel(parentUserId, NotificationEventType.INVOICE_STATUS_CHANGED, labels.title, body, {
    entityKind: "invoice",
    entityId: invoice.id,
    invoiceId: invoice.id,
    action,
    newStatus: action === "markedPaid" ? "PAID" : undefined,
    proofPending: action === "proofSubmitted",
    amount,
    currency,
  });
}

// ─── Payment-method event builder ─────────────────────────────────────

/**
 * Build payloads for `PAYMENT_METHOD_CHANGED` keyed by `action`.
 *
 * @param userId     The user owning the payment method.
 * @param action     Which mutation triggered the event.
 * @param locale     Optional locale code.
 * @param metadata   Optional metadata bag (must include `identifier` if
 *                   the locale's body template requires it). If `identifier`
 *                   is absent the literal `"—"` is substituted for safety.
 * @returns One `CommunicationPayload[]` of length up to 5.
 */
export function buildPaymentMethodChangedPayloads(
  userId: string,
  action: "created" | "updated" | "deleted" | "setDefault" | "verified",
  locale?: string,
  metadata?: Record<string, string>
): CommunicationPayload[] {
  if (!userId) return [];
  const labels = labelsFor(locale).paymentMethodChanged[action];
  const identifier = metadata?.identifier ?? "—";
  const body = labels.body({ identifier });
  return buildPerChannel(userId, NotificationEventType.PAYMENT_METHOD_CHANGED, labels.title, body, {
    entityKind: "paymentMethod",
    entityId: metadata?.paymentMethodId ?? metadata?.identifier ?? "unknown",
    action,
    identifier,
    ...metadata,
  });
}

// ─── Class lifecycle event builder ────────────────────────────────────

const CLASS_LIFECYCLE_EVENTS: ReadonlySet<NotificationEventType> = new Set([
  NotificationEventType.CLASS_SCHEDULED,
  NotificationEventType.CLASS_ACTIVATED,
  NotificationEventType.CLASS_STARTED,
  NotificationEventType.CLASS_COMPLETED,
  NotificationEventType.CLASS_MARKED_ABSENT,
  NotificationEventType.CLASS_MARKED_MISSED,
  NotificationEventType.CLASS_LEAVE_REQUESTED,
  NotificationEventType.CLASS_RESCHEDULED,
  NotificationEventType.CLASS_CANCELLED,
  NotificationEventType.CLASS_RESET,
]);

/**
 * Build payloads for a class-lifecycle event. Emits 4 payloads per affected
 * user (one per channel). The caller passes the SAME `affectedUserIds` to
 * `dispatchWithPreferences` so per-user prefs + the event-channel allowlist
 * are applied downstream.
 *
 * `studentName` is sourced from the metadata bag (the class lifecycle
 * services own the join that resolves the display name). If absent the
 * literal `"—"` is substituted so the title/body still render.
 *
 * For `CLASS_RESCHEDULED`, `metadata.newStartAt` (ISO string) MUST be
 * supplied — the body template interpolates it.
 *
 * @param classInstance     The class instance row.
 * @param eventType         One of the 10 CLASS_* lifecycle event types.
 * @param affectedUserIds   Users who should receive the notification.
 * @param locale            Optional locale code.
 * @param metadata          Optional metadata bag (`studentName`, `newStartAt`,
 *                          any extra context).
 * @returns `CommunicationPayload[]` of length up to `5 * affectedUserIds.length`.
 *          Returns `[]` if `affectedUserIds` is empty or `eventType` is not
 *          a CLASS_* lifecycle event.
 */
export function buildClassLifecyclePayloads(
  classInstance: ClassInstanceSelectType,
  eventType: NotificationEventType,
  affectedUserIds: string[],
  locale?: string,
  metadata?: Record<string, string>
): CommunicationPayload[] {
  const studentName = metadata?.studentName ?? "—";
  const baseParams = classBodyParams(classInstance, studentName);
  const baseMetadata: PayloadMetadata = {
    entityKind: "class",
    entityId: classInstance.id,
    classInstanceId: classInstance.id,
    studentName,
    scheduledStartAt: baseParams.scheduledStartAt,
    newStartAt: metadata?.newStartAt,
  };

  return buildLifecyclePayloads(
    affectedUserIds,
    eventType,
    CLASS_LIFECYCLE_EVENTS,
    locale,
    metadata,
    baseMetadata,
    labels => renderClassLifecycle(labels, eventType, baseParams, metadata)
  );
}

// ─── Student lifecycle event builder ──────────────────────────────────

const STUDENT_LIFECYCLE_EVENTS: ReadonlySet<NotificationEventType> = new Set([
  NotificationEventType.STUDENT_TEACHER_REASSIGNED,
  NotificationEventType.STUDENT_STATUS_CHANGED,
  NotificationEventType.STUDENT_QUOTA_OVERRIDDEN,
]);

/**
 * Build payloads for a student-lifecycle event. Emits 4 payloads per
 * affected user (one per channel).
 *
 * Signature is `(studentId, eventType, affectedUserIds, locale?, metadata?)`:
 * builders do NOT read the `students` table. Context (student name, old/new
 * status, quota values, recipient role) is supplied via `metadata` by the
 * domain service that owns the join.
 *
 * `STUDENT_TEACHER_REASSIGNED` is recipient-discriminated: pass
 * `metadata.recipient` = `"parent"` | `"oldTeacher"` | `"newTeacher"` to
 * pick the title/body variant. When omitted, `"parent"` is the safe default.
 *
 * `metadata.studentName` is required for all student events (falls back to
 * `"—"` if absent so templates still render). `metadata.oldStatus` /
 * `metadata.newStatus` are required for `STUDENT_STATUS_CHANGED`.
 * `metadata.newClassesRemaining` (numeric string) is required for
 * `STUDENT_QUOTA_OVERRIDDEN`. `metadata.oldTeacherName` /
 * `metadata.newTeacherName` are required for the matching recipient variant
 * of `STUDENT_TEACHER_REASSIGNED`.
 *
 * @param studentId         The student row's id (carried in metadata).
 * @param eventType         One of the 3 STUDENT_* lifecycle event types.
 * @param affectedUserIds   Users who should receive the notification.
 * @param locale            Optional locale code.
 * @param metadata          Required context bag per event type (see above).
 * @returns `CommunicationPayload[]` of length up to `5 * affectedUserIds.length`.
 */
export function buildStudentLifecyclePayloads(
  studentId: string,
  eventType: NotificationEventType,
  affectedUserIds: string[],
  locale?: string,
  metadata?: Record<string, string>
): CommunicationPayload[] {
  const studentName = metadata?.studentName ?? "—";
  const baseMetadata: PayloadMetadata = {
    entityKind: "student",
    entityId: studentId,
    studentId,
    studentName,
    oldStatus: metadata?.oldStatus,
    newStatus: metadata?.newStatus,
  };

  return buildLifecyclePayloads(
    affectedUserIds,
    eventType,
    STUDENT_LIFECYCLE_EVENTS,
    locale,
    metadata,
    baseMetadata,
    labels => renderStudentLifecycle(labels, eventType, studentName, metadata)
  );
}

// ─── Lesson report event builders ─────────────────────────────────────

/**
 * Build payloads for `LESSON_REPORT_SUBMITTED` — fans out to supervisors
 * (or any users with `LESSON_REPORTS_REVIEW`) when a teacher submits a report.
 *
 * @param reportId          The lesson report id (metadata.entityId).
 * @param affectedUserIds   Reviewer user ids to notify.
 * @param locale            Optional locale code.
 * @param metadata          Context bag: `teacherName` (required for body),
 *                          optional `classInstanceId`.
 */
export function buildLessonReportSubmittedPayloads(
  reportId: string,
  affectedUserIds: string[],
  locale?: string,
  metadata?: { teacherName?: string; classInstanceId?: string }
): CommunicationPayload[] {
  if (!reportId || affectedUserIds.length === 0) return [];

  const labels = labelsFor(locale).lessonReportSubmitted;
  const teacherName = metadata?.teacherName ?? "—";
  const body = labels.body({ reportId, teacherName });

  const sharedMetadata: PayloadMetadata = {
    entityKind: "lessonReport",
    entityId: reportId,
    classInstanceId: metadata?.classInstanceId,
    teacherName,
    totalRecipients: affectedUserIds.length,
  };

  return fanOutToUsers(
    affectedUserIds,
    NotificationEventType.LESSON_REPORT_SUBMITTED,
    labels.title,
    body,
    sharedMetadata
  );
}

/**
 * Build payloads for `LESSON_REPORT_REVIEWED` — notifies the submitting
 * teacher when a report is approved or rejected.
 *
 * @param reportId   The lesson report id.
 * @param teacherUserId  Submitting teacher's user id.
 * @param decision   `"approved"` | `"rejected"` (also stored in metadata).
 * @param locale     Optional locale code.
 * @param metadata   Context bag: `teacherName`, optional `classInstanceId`.
 */
export function buildLessonReportReviewedPayloads(
  reportId: string,
  teacherUserId: string,
  decision: "approved" | "rejected",
  locale?: string,
  metadata?: { teacherName?: string; classInstanceId?: string }
): CommunicationPayload[] {
  if (!reportId || !teacherUserId) return [];

  const labels = labelsFor(locale).lessonReportReviewed;
  const teacherName = metadata?.teacherName ?? "—";
  const body = labels.body({ reportId, teacherName, decision });

  return buildPerChannel(teacherUserId, NotificationEventType.LESSON_REPORT_REVIEWED, labels.title, body, {
    entityKind: "lessonReport",
    entityId: reportId,
    classInstanceId: metadata?.classInstanceId,
    decision,
    teacherName,
  });
}

/**
 * Build payloads for `NEW_COMPLAINT` — fans out to users with
 * `COMPLAINTS_LIST` when a parent files a complaint.
 *
 * @param complaintId       The complaint row id.
 * @param affectedUserIds   Reviewer user ids to notify.
 * @param locale            Optional locale code.
 * @param metadata          Optional context (`category`, etc.).
 */
export function buildNewComplaintPayloads(
  complaintId: string,
  affectedUserIds: string[],
  locale?: string,
  metadata?: { category?: string }
): CommunicationPayload[] {
  if (!complaintId || affectedUserIds.length === 0) return [];

  const labels = labelsFor(locale).newComplaint;
  const category = metadata?.category ?? "—";
  const body = labels.body({ complaintId, category });

  const sharedMetadata: PayloadMetadata = {
    entityKind: "complaint",
    entityId: complaintId,
    category,
    totalRecipients: affectedUserIds.length,
  };

  return fanOutToUsers(affectedUserIds, NotificationEventType.NEW_COMPLAINT, labels.title, body, sharedMetadata);
}
