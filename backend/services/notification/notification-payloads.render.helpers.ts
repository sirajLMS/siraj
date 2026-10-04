import { NotificationEventType } from "@/backend/enum";
import type {
  ClassLifecycleBodyParams,
  NotificationsLabels,
  StudentTeacherReassignmentRecipient,
} from "@/shared/locale/types/notifications";

const VALID_REASSIGNMENT_RECIPIENTS: ReadonlySet<string> = new Set(["parent", "oldTeacher", "newTeacher"]);

function isStudentTeacherReassignmentRecipient(value: unknown): value is StudentTeacherReassignmentRecipient {
  return typeof value === "string" && VALID_REASSIGNMENT_RECIPIENTS.has(value);
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
export function renderClassLifecycle(
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
export function renderStudentLifecycle(
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
