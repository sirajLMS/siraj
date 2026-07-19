"use client";

import type {
  MissedClassAlert,
  StudentProgressFeedItem,
  TeacherScheduleRow,
} from "@/frontend/common/stores/teacherDashboardTypes";
import type { TeacherDashboardViewLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";

/**
 * TeacherDashboard ViewModel.
 *
 * The container (`TeacherDashboardContainer`) owns all data fetching
 * (Apollo `useQuery`/`useMutation`), translation, side effects, and the
 * manual-entry dialog + snackbar. It passes a flat prop bag to this hook.
 * Per the Phase 3b migration plan and established Phase 3a pattern, the
 * ViewModel hook derives presenter-only values (page count, formatted
 * welcome summary) so the mobile/desktop switcher renders the same
 * interface for both tiers. No viewport logic ever lives here.
 */

export interface TeacherDashboardViewModel {
  readonly userName: string;
  readonly metricItems: readonly MetricItem[];
  readonly scheduleRows: readonly TeacherScheduleRow[];
  readonly progressFeed: readonly StudentProgressFeedItem[];
  readonly missedAlert: MissedClassAlert | null;
  readonly welcomeDateSummary: string;
  readonly activeSessionsCount: number;
  readonly labels: TeacherDashboardViewLabels;
  readonly lastUpdated: string;
  readonly activationError: string | null;
  readonly canActivate: boolean;
  readonly canManualEntry: boolean;
  readonly canPrintSchedule: boolean;
  readonly loading?: boolean;
  // --- lesson report submission ------------------------------------------------
  readonly lessonReportDialogOpen: boolean;
  readonly lessonReportSelectedClassInstanceId: string | null;
  readonly lessonReportDefaultDurationMinutes?: number;
  readonly lessonReportLabels: import("@/frontend/common/views/dashboard/teachers/dashboard/types/lessonReportFormTypes").LessonReportFormLabels;
  // --- handlers ---------------------------------------------------------------
  readonly onPrintSchedule: () => void;
  readonly onManualEntry: () => void;
  readonly onNewSession: () => void;
  readonly manualEntryOpen: boolean;
  readonly manualEntryDefaultActive: boolean;
  readonly teacherId: string;
  readonly onManualEntryClose: () => void;
  readonly onManualEntrySubmit: (data: {
    readonly studentId: string;
    readonly subjectId: string;
    readonly scheduledStartAt: string;
    readonly scheduledEndAt: string;
    readonly durationMinutes: number;
    readonly classType: string;
  }) => Promise<void>;
  readonly onActivate?: (id: string) => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
  readonly onMarkClassCompleted?: (classInstanceId: string) => void;
  readonly onLessonReportDialogClose: () => void;
  readonly onLessonReportSubmit: (
    input: import("@/frontend/common/views/dashboard/teachers/dashboard/types/lessonReportFormTypes").LessonReportFormSubmitInput
  ) => Promise<void>;
  readonly onViewAll?: () => void;
  readonly onDownloadHandbook: () => void;
  readonly onContactCoordinator: () => void;
  readonly onSupport: () => void;
  // NEW FOR PLAN v5: lifted permission booleans and `absentDialog` state —
  // previously owned by the tier-side `RequirePermission`/`useState` patterns
  // in teacherActiveSessionControls.*, teacherScheduleStatusContent.mobile,
  // teacherScheduleSessionActionsCell.desktop — see specs.md §3 N3 + N7 + §6.4.
  // `onAbsentDialogOpen` is the bound `() => void` form consumed by the
  // `TeacherActiveSessionControls*` components; the schedule cards own the
  // binding to a specific row via `onAbsentDialogOpenForClass(row.id)`.
  readonly hasSessionUpdateStatusStart: boolean;
  readonly hasSessionUpdateStatusAbsent: boolean;
  readonly hasSessionUpdateStatusLeave: boolean;
  readonly hasSessionActivateClass: boolean;
  readonly absentDialogOpen: boolean;
  readonly onAbsentDialogOpen: () => void;
  readonly onAbsentDialogOpenForClass: (classInstanceId: string) => void;
  readonly onAbsentDialogClose: () => void;
  readonly onAbsentDialogConfirm: () => void;
  readonly dateValue: string;
  readonly onDateChange: (date: string) => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
  // --- derived presenter values ----------------------------------------------
  readonly pageCount: number;
  /**
   * Welcome summary for the mobile header — combines the active-welcome
   * template with the date and the active-sessions count.
   */
  readonly welcomeMobileSummary: string;
}

export type UseTeacherDashboardViewModelProps = Omit<TeacherDashboardViewModel, "pageCount" | "welcomeMobileSummary">;

function derivePageCount(totalCount: number | undefined, pageSize: number): number {
  return totalCount !== undefined && pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;
}

function buildWelcomeMobileSummary(
  labels: TeacherDashboardViewLabels,
  welcomeDateSummary: string,
  activeSessionsCount: number
): string {
  return labels.activeWelcome.mobileSummary(welcomeDateSummary, activeSessionsCount);
}

function buildTeacherDashboardResult(props: UseTeacherDashboardViewModelProps): TeacherDashboardViewModel {
  const pageCount = derivePageCount(props.totalCount, props.pageSize ?? 10);
  const welcomeMobileSummary = buildWelcomeMobileSummary(
    props.labels,
    props.welcomeDateSummary,
    props.activeSessionsCount
  );
  return {
    ...props,
    page: props.page ?? 0,
    pageSize: props.pageSize ?? 10,
    pageCount,
    welcomeMobileSummary,
  };
}

export function useTeacherDashboardViewModel(props: UseTeacherDashboardViewModelProps): TeacherDashboardViewModel {
  return buildTeacherDashboardResult(props);
}
