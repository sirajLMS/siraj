import { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql";
import type { TeacherClassRow } from "@/frontend/common/views/dashboard/teachers/classes/__shared__/teacherClassListViewShared";
import type { TeacherClassListViewModel } from "@/frontend/common/views/dashboard/teachers/classes/useTeacherClassListViewModel";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";

export const teacherClassListLocale: AppLocale = "en";

/** Pager chrome translations (next/previous page tooltips) come from the Admin namespace. */
export const adminLabels = readTranslation(Translation.Dashboard.Admin, teacherClassListLocale);

export const teacherClassListLabels: TeacherClassListViewModel["labels"] = {
  pageTitle: "Fixture Classes Title",
  pageSubtitle: "Fixture Classes Subtitle",
  noClasses: "Fixture no classes message",
  columns: {
    student: "Fixture Student Column",
    schedule: "Fixture Schedule Column",
    status: "Fixture Status Column",
    actions: "Fixture Actions Column",
  },
  viewDetails: "Fixture View Details",
  viewClassAudit: "Fixture View Audit",
  joinVideo: "Fixture Join Video",
  durationMinutes: minutes => `Fixture ${minutes} minutes`,
  failedToLoad: "Fixture failed to load classes",
  statusLabels: {
    PENDING: "Fixture Pending",
    TAKEN: "Fixture Taken",
    ABSENT: "Fixture Absent",
    LEAVE: "Fixture Leave",
    NOT_ACTIVATED: "Fixture Not Activated",
    ACTIVATED: "Fixture Activated",
    RUNNING: "Fixture Running",
    COMPLETED: "Fixture Completed",
    ON_DEMAND_CONFLICT_HELD: "Fixture Conflict Held",
    ON_DEMAND_NO_CREDITS_ABSENT: "Fixture No Credits Absent",
    ON_DEMAND_NO_CREDITS_CANCELLED: "Fixture No Credits Cancelled",
    ON_DEMAND_PENDING_CREDITS: "Fixture Pending Credits",
  },
};

/** A joinable row: future-ish schedule, non-frozen, with a meeting join URL. */
export function makeTeacherClassRow(overrides: Partial<TeacherClassRow> = {}): TeacherClassRow {
  return {
    id: "class-1",
    studentName: "Ahmed Fixture",
    scheduledStartAt: "2026-06-01T15:00:00.000Z",
    scheduledEndAt: "2026-06-01T16:00:00.000Z",
    durationMinutes: 60,
    executionState: ClassExecutionState.Activated,
    outcome: ClassOutcome.Pending,
    isFrozen: false,
    meetingJoinUrl: "https://meet.example.com/fixture",
    effectiveMeeting: null,
    ...overrides,
  };
}

export function makeCompletedTeacherClassRow(overrides: Partial<TeacherClassRow> = {}): TeacherClassRow {
  return makeTeacherClassRow({
    id: "class-2",
    studentName: "Sara Fixture",
    meetingJoinUrl: null,
    executionState: ClassExecutionState.Completed,
    ...overrides,
  });
}

export function buildTeacherClassListViewModel(
  overrides: Partial<TeacherClassListViewModel> = {}
): TeacherClassListViewModel {
  return {
    rows: [makeTeacherClassRow()],
    loading: false,
    error: null,
    labels: teacherClassListLabels,
    locale: "en",
    handleViewClassAudit: () => {},
    ...overrides,
  };
}
