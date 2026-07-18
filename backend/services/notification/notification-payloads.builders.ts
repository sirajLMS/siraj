/**
 * Pure notification payload builders — the SOLE producer of `CommunicationPayload`
 * objects in the codebase. Domain services call these builders and hand the
 * resulting array to `dispatchWithPreferences` (specs.md rule #2).
 *
 * Contract (specs.md §5.1):
 *   - PURE: no I/O, no logger, no side-effects. The only "external" call is
 *     `getServerTranslations(locale)` — a synchronous lookup against the
 *     compile-time i18n registry in `@/shared/locale`, which is safe.
 *   - LOCALIZED: every title/body flows through the `notifications` namespace
 *     in `shared/locale/notifications/`. NO hardcoded English literals
 *     (specs.md F3).
 *   - IDEMPOTENT: same inputs -> same outputs.
 *   - ALL FOUR CHANNELS: every builder emits one payload per channel
 *     (`on_app`, `email`, `sms`, `push`). Channel filtering by user prefs +
 *     event allowlist happens in `dispatchWithPreferences`.
 *
 * Fan-out strategy: each builder accepts `affectedUserIds[]` and emits
 * `4 * affectedUserIds.length` payloads, one per (user, channel). Callers
 * pass the SAME `affectedUserIds` to `dispatchWithPreferences` so prefs are
 * applied per user. For single-recipient events (invoice, payment-method)
 * pass a one-element array.
 */

import { NotificationChannel, NotificationEventType } from "@/backend/enum";
import type {
  ChannelDispatchResult,
  ClassInstanceSelectType,
  CommunicationChannelType,
  CommunicationPayload,
  InvoiceSelectType,
} from "@/backend/types";
import type { NotificationMetadata } from "@/backend/types/notifications/notification-alerts.metadata.types";
import { getServerTranslations } from "@/shared/locale";
import type {
  ClassLifecycleBodyParams,
  NotificationsLabels,
  StudentTeacherReassignmentRecipient,
} from "@/shared/locale/notifications";

/** Structured notification metadata plus channel-adapter bag fields (`to`, `data`, etc.). */
type PayloadMetadata = NotificationMetadata & Record<string, unknown>;

// ─── Helpers ───────────────────────────────────────────────────────────

/**
 * The four dispatch channels as `CommunicationChannelType` literals.
 *
 * NOTE: `CommunicationChannelType = "on_app" | "email" | "sms" | "push"`
 * (lowercase) is the existing payload-channel type alias. The
 * `NotificationChannel` enum members (`EMAIL`, `SMS`, `PUSH`, `ON_APP`)
 * are uppercase and are used to key prefs + DB columns. We map enum →
 * payload-channel here in a single place so builders can stay typed
 * against the lowercase alias without sprinkling string literals
 * throughout call sites (specs.md F15 — no `case "EMAIL":` literals).
 */
const CHANNEL_FROM_ENUM: Readonly<Record<NotificationChannel, CommunicationChannelType>> = Object.freeze({
  [NotificationChannel.ON_APP]: "on_app",
  [NotificationChannel.EMAIL]: "email",
  [NotificationChannel.SMS]: "sms",
  [NotificationChannel.PUSH]: "push",
});

const ALL_CHANNELS: readonly NotificationChannel[] = [
  NotificationChannel.ON_APP,
  NotificationChannel.EMAIL,
  NotificationChannel.SMS,
  NotificationChannel.PUSH,
] as const;

function labelsFor(locale: string | undefined): NotificationsLabels {
  return getServerTranslations(locale ?? "en").notificationsTranslations;
}

/**
 * Build one `CommunicationPayload` per channel for the given user/event.
 * `body` is shared across channels (channel adapters handle format
 * differences — see `CommunicationService.dispatch`).
 */
function buildPerChannel(
  userId: string,
  eventType: NotificationEventType,
  title: string,
  body: string,
  metadata: PayloadMetadata
): CommunicationPayload[] {
  if (!userId) return [];
  const payloads: CommunicationPayload[] = [];
  for (const channel of ALL_CHANNELS) {
    payloads.push({
      userId,
      title,
      body,
      channel: CHANNEL_FROM_ENUM[channel],
      eventType,
      metadata,
    });
  }
  return payloads;
}

function classBodyParams(classInstance: ClassInstanceSelectType, studentName: string): ClassLifecycleBodyParams {
  return {
    studentName,
    scheduledStartAt: classInstance.scheduledStartAt.toISOString(),
  };
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
      const recipient = (metadata?.recipient as StudentTeacherReassignmentRecipient | undefined) ?? "parent";
      const safeRecipient: StudentTeacherReassignmentRecipient =
        recipient === "parent" || recipient === "oldTeacher" || recipient === "newTeacher" ? recipient : "parent";
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
 * @returns One `CommunicationPayload[]` of length 4 (one per channel).
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
 * @returns One `CommunicationPayload[]` of length 4.
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
 * @returns `CommunicationPayload[]` of length `4 * affectedUserIds.length`.
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
  if (affectedUserIds.length === 0) return [];
  if (!CLASS_LIFECYCLE_EVENTS.has(eventType)) return [];

  const labels = labelsFor(locale);
  const studentName = metadata?.studentName ?? "—";
  const baseParams = classBodyParams(classInstance, studentName);

  const rendered = renderClassLifecycle(labels, eventType, baseParams, metadata);
  if (!rendered) return [];
  const { title, body } = rendered;

  const sharedMetadata: PayloadMetadata = {
    entityKind: "class",
    entityId: classInstance.id,
    classInstanceId: classInstance.id,
    studentName,
    scheduledStartAt: baseParams.scheduledStartAt,
    newStartAt: metadata?.newStartAt,
    totalRecipients: affectedUserIds.length,
    ...metadata,
  };

  const payloads: CommunicationPayload[] = [];
  for (const userId of affectedUserIds) {
    payloads.push(...buildPerChannel(userId, eventType, title, body, sharedMetadata));
  }
  return payloads;
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
 * Per specs.md §5.1 the signature is `(studentId, eventType, affectedUserIds, locale?, metadata?)`:
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
 * @returns `CommunicationPayload[]` of length `4 * affectedUserIds.length`.
 */
export function buildStudentLifecyclePayloads(
  studentId: string,
  eventType: NotificationEventType,
  affectedUserIds: string[],
  locale?: string,
  metadata?: Record<string, string>
): CommunicationPayload[] {
  if (affectedUserIds.length === 0) return [];
  if (!STUDENT_LIFECYCLE_EVENTS.has(eventType)) return [];

  const labels = labelsFor(locale);
  const studentName = metadata?.studentName ?? "—";

  const rendered = renderStudentLifecycle(labels, eventType, studentName, metadata);
  if (!rendered) return [];
  const { title, body } = rendered;

  const sharedMetadata: PayloadMetadata = {
    entityKind: "student",
    entityId: studentId,
    studentId,
    studentName,
    oldStatus: metadata?.oldStatus,
    newStatus: metadata?.newStatus,
    totalRecipients: affectedUserIds.length,
    ...metadata,
  };

  const payloads: CommunicationPayload[] = [];
  for (const userId of affectedUserIds) {
    payloads.push(...buildPerChannel(userId, eventType, title, body, sharedMetadata));
  }
  return payloads;
}

// Re-exported type so consumers can typehint dispatch results without
// reaching into `@/backend/types` directly from this module.
export type { ChannelDispatchResult };
