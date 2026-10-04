import type {
  TeacherFutureScheduleQuery_teacherFutureSchedule_classes as FutureClass,
  LogTeacherSupportRequestMutationVariables,
  TeacherFutureScheduleQuery_teacherFutureSchedule,
  UpdateSessionStatusLeaveMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/utils/logger";
import type {
  ImportantNoteItem,
  SupportContactData,
} from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import type { TeacherFutureScheduleLabels } from "@/shared/locale/types/dashboard/teachers/futureSchedule";
import { getErrorMessage } from "@/shared/utils/error";

/**
 * Pure derivation and handler-factory helpers for the FutureSchedule ViewModel.
 * The hook owns the Apollo/React wiring; these helpers own the schedule
 * normalization and the leave / support-request mutation flows so the hook
 * itself stays a thin composition.
 */

/** Toast callback wired to `useNotifications().show` by the ViewModel. */
export type FutureScheduleToast = (message: string, severity: "success" | "error") => void;

/** Bound `updateSessionStatusLeave` mutation as provided by `useMutation`. */
export type RequestLeaveFn = (options: {
  readonly variables: UpdateSessionStatusLeaveMutationVariables;
}) => Promise<unknown>;

/** Bound `logTeacherSupportRequest` mutation as provided by `useMutation`. */
export type LogSupportRequestFn = (options: {
  readonly variables: LogTeacherSupportRequestMutationVariables;
}) => Promise<unknown>;

const EMPTY_CLASSES: readonly FutureClass[] = [];

function isFutureClass(value: unknown): value is FutureClass {
  return (
    typeof value === "object" && value !== null && !Array.isArray(value) && "id" in value && "scheduledDate" in value
  );
}

function isFutureClassArray(value: unknown): value is FutureClass[] {
  return Array.isArray(value) && value.every(isFutureClass);
}

/** Returns the schedule's classes, falling back to an empty list when the payload is malformed. */
export function deriveFutureClasses(
  schedule: TeacherFutureScheduleQuery_teacherFutureSchedule | null | undefined
): readonly FutureClass[] {
  const rawClasses = schedule?.classes ?? [];
  return isFutureClassArray(rawClasses) ? rawClasses : EMPTY_CLASSES;
}

/** Maps the schedule's important notes onto the view's note items, defaulting nullable copy fields. */
export function deriveImportantNotes(
  schedule: TeacherFutureScheduleQuery_teacherFutureSchedule | null | undefined
): readonly ImportantNoteItem[] {
  return (schedule?.importantNotes ?? []).map(n => ({
    id: n.id ?? "",
    title: n.title ?? "",
    body: n.body,
    priority: n.priority,
    startsAt: n.startsAt,
    expiresAt: n.expiresAt,
  }));
}

/** Returns the schedule's support contact, or `null` when the backend did not provide one. */
export function deriveSupportContact(
  schedule: TeacherFutureScheduleQuery_teacherFutureSchedule | null | undefined
): SupportContactData | null {
  return schedule?.supportContact
    ? {
        id: schedule.supportContact.id,
        name: schedule.supportContact.name,
        role: schedule.supportContact.role,
        avatarUrl: schedule.supportContact.avatarUrl,
        phone: schedule.supportContact.phone,
      }
    : null;
}

/** Collects the scheduled dates of all classes so the mini calendar can mark them. */
export function deriveClassDates(classes: readonly FutureClass[]): readonly string[] {
  return classes
    .filter((c): c is FutureClass & { scheduledDate: string } => c.scheduledDate !== null)
    .map(c => c.scheduledDate);
}

function isQuotaExceeded(message: string): boolean {
  return message.includes("quota") || message.includes("Leave quota exceeded");
}

/**
 * Builds the leave-request flow: submits the mutation, refreshes the schedule,
 * and toasts success or the matching failure message (quota errors get their
 * own localized copy).
 */
export function createRequestLeaveHandler(input: {
  readonly requestLeave: RequestLeaveFn;
  readonly refetch: () => Promise<unknown>;
  readonly showToast: FutureScheduleToast;
  readonly labels: TeacherFutureScheduleLabels;
}): (classInstanceId: string) => Promise<void> {
  const { requestLeave, refetch, showToast, labels } = input;
  return async classInstanceId => {
    try {
      await requestLeave({
        variables: {
          classInstanceId,
          leaveReason: labels.defaultLeaveReason,
        },
      });
      await refetch();
      showToast(labels.notifications.leaveRequested, "success");
    } catch (err) {
      const message = getErrorMessage(err);
      logger.error({ caller: "FutureScheduleContainer" }, `Leave request failed: ${message}`);
      if (isQuotaExceeded(message)) {
        showToast(labels.errors.quotaExceeded, "error");
      } else {
        showToast(message || labels.errors.leaveRequestFailed, "error");
      }
    }
  };
}

/**
 * Builds the support-contact flow: records the request via the
 * `logTeacherSupportRequest` mutation and toasts the outcome.
 */
export function createSupportContactHandler(input: {
  readonly logSupportRequest: LogSupportRequestFn;
  readonly showToast: FutureScheduleToast;
  readonly labels: TeacherFutureScheduleLabels;
}): () => Promise<void> {
  const { logSupportRequest, showToast, labels } = input;
  return async () => {
    try {
      await logSupportRequest({
        variables: {
          input: { reason: labels.supportRequestReason },
        },
      });
      showToast(labels.notifications.supportRequestSent, "success");
    } catch {
      showToast(labels.errors.supportRequestFailed, "error");
    }
  };
}
