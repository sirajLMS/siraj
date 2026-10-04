import {
  BookingStatus,
  ClassExecutionState,
  ClassOutcome,
  type ParentDashboardMetricsQuery_parentDashboardMetrics,
  type ParentDashboardScheduleQuery_parentDashboardSchedule_rows,
  type ParentDashboardScheduleQuery_parentDashboardSchedule_rows_effectiveMeeting,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  ParentDashboardMetrics,
  ParentLiveClassStatus,
  ParentScheduleRow,
  StudentProgressItem,
  WorkshopPromo,
} from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";

export interface SchedulePagination {
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
}

export type MetricsResult = ParentDashboardMetricsQuery_parentDashboardMetrics;
type ScheduleRow = ParentDashboardScheduleQuery_parentDashboardSchedule_rows;

function mapExecutionStateToLiveClassStatus(executionState: string, outcome: string): ParentLiveClassStatus {
  if (executionState === "ACTIVATED") return "starting_soon";
  if (outcome === "PENDING") return "pending";
  return "scheduled";
}

function resolveMeetingJoinUrl(
  effectiveMeeting?: ParentDashboardScheduleQuery_parentDashboardSchedule_rows_effectiveMeeting | null
): string | null {
  const fromEffective = effectiveMeeting?.joinUrl?.trim();
  return fromEffective ?? null;
}

export function buildScheduleRow(row: ScheduleRow): ParentScheduleRow {
  const joinUrl = resolveMeetingJoinUrl(row.effectiveMeeting);
  const executionState = row.executionState ?? ClassExecutionState.NotActivated;
  const outcome = row.outcome ?? ClassOutcome.Pending;
  return {
    id: row.id ?? "",
    rowNumber: 0,
    classTime: row.classTimeFormatted ?? "",
    durationMinutes: row.durationMinutes ?? 0,
    studentId: row.studentId ?? undefined,
    studentName: row.studentName ?? "",
    studentInitials: row.studentInitials ?? "",
    studentAvatarUrl: row.studentAvatarUrl ?? undefined,
    teacherId: row.teacherId ?? undefined,
    teacherName: row.teacherName ?? "",
    teacherAvatarUrl: row.teacherAvatarUrl ?? undefined,
    bookingStatus: row.bookingStatus === BookingStatus.Rescheduled ? "rescheduled" : "confirmed",
    liveClassStatus: mapExecutionStateToLiveClassStatus(executionState, outcome),
    executionState,
    outcome,
    isFrozen: row.isFrozen ?? false,
    videoEnabled: Boolean(joinUrl),
    meetingJoinUrl: joinUrl,
    effectiveMeeting: row.effectiveMeeting ?? null,
  };
}

export function buildMetrics(result: MetricsResult | null | undefined): ParentDashboardMetrics {
  return {
    totalStudents: result?.metrics?.totalStudents ?? 0,
    todaysClasses: result?.metrics?.todaysClasses ?? 0,
    pendingInvoicesCount: result?.metrics?.pendingInvoicesCount ?? 0,
    pendingInvoicesAmount: result?.metrics?.pendingInvoicesAmount ?? "0",
    performanceAvg: result?.metrics?.performanceAvg ?? 0,
    performanceAvgMobile: result?.metrics?.performanceAvgMobile ?? 0,
    pendingMessages: result?.metrics?.pendingMessages ?? 0,
  };
}

export function buildStudentProgress(result: MetricsResult | null | undefined): readonly StudentProgressItem[] {
  return (result?.studentProgress ?? []).map(s => ({
    id: s?.id ?? "",
    name: s?.name ?? "",
    completionPercent: s?.completionPercent ?? 0,
  }));
}

export function buildWorkshopPromo(result: MetricsResult | null | undefined): WorkshopPromo | null {
  const workshopPromo = result?.workshopPromo;
  if (!workshopPromo) return null;
  return {
    title: workshopPromo.title ?? "",
    description: workshopPromo.description ?? "",
    imageUrl: workshopPromo.imageUrl ?? "",
  };
}

export function buildPaginationArgs(page: number, pageSize: number) {
  return {
    page: page + 1,
    first: pageSize,
    skip: null,
    after: null,
    before: null,
    last: null,
    maxCount: null,
  };
}

export function computePageCount(pageSize: number, totalCount: number): number {
  if (pageSize <= 0) return 0;
  return Math.max(1, Math.ceil(totalCount / pageSize));
}
