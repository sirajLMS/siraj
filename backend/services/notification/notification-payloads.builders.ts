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
 *     in `shared/locale/notifications/`. NO hardcoded English literals.
 *   - IDEMPOTENT: same inputs -> same outputs.
 *   - ALL FIVE CHANNELS: every builder emits one payload per channel
 *     (`on_app`, `email`, `sms`, `push`, `whatsapp`). Channel filtering by user
 *     prefs + event allowlist happens in `dispatchWithPreferences`.
 *
 * Fan-out strategy: each builder accepts `affectedUserIds[]` and emits
 * up to `5 * affectedUserIds.length` payloads, one per (user, channel). Callers
 * pass the SAME `affectedUserIds` to `dispatchWithPreferences` so prefs are
 * applied per user. For single-recipient events (invoice, payment-method)
 * pass a one-element array. WhatsApp payloads are only emitted for events
 * that have a template in `NOTIFICATION_TEMPLATE_MAP`.
 */

import { NotificationEventType } from "@/backend/enum";
import {
  buildPerChannel,
  labelsFor,
  type PayloadMetadata,
} from "@/backend/services/notification/notification-payloads.channel.helpers";
import {
  renderClassLifecycle,
  renderStudentLifecycle,
} from "@/backend/services/notification/notification-payloads.render.helpers";
import type { ClassInstanceSelectType, CommunicationPayload, InvoiceSelectType } from "@/backend/types";
import type { ClassLifecycleBodyParams, NotificationsLabels } from "@/shared/locale/types/notifications";

export { NOTIFICATION_TEMPLATE_MAP } from "@/backend/services/notification/notification-payloads.channel.helpers";

/**
 * Fan out a single rendered `{ title, body }` to every affected user across
 * every channel. Shared by the multi-recipient lifecycle builders (class,
 * student, lesson-report-submitted, new-complaint) so the
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
 * set, and base metadata. Eliminates the duplication between
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

// ─── Invoice event builders ───────────────────────────────────────────

/**
 * Build payloads for `INVOICE_GENERATED`.
 *
 * @param parentUserId  The parent user receiving the notification.
 * @param invoice       The freshly-generated invoice row.
 * @param locale        Optional locale code (defaults to "en").
 * @returns `CommunicationPayload[]` — one entry per channel (up to 5 total).
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
 * Build payloads for a class-lifecycle event. Emits up to 5 payloads per
 * affected user (one per channel; WhatsApp only when a template exists). The
 * caller passes the SAME `affectedUserIds` to `dispatchWithPreferences` so
 * per-user prefs + the event-channel allowlist are applied downstream.
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
 * Build payloads for a student-lifecycle event. Emits up to 5 payloads per
 * affected user (one per channel; WhatsApp only when a template exists).
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
