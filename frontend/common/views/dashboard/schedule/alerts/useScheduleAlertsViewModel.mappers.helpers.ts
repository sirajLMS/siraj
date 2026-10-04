import { PeopleOutlined, SchoolOutlined } from "@mui/icons-material";
import {
  ClassExecutionState,
  ClassOutcome,
  type AdminDashboardScheduleQuery_adminDashboardSchedule_rows as ScheduleRow,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  AcademicClassRow,
  AlertsMetric,
  ClassSessionAction,
  ClassSessionStatus,
} from "@/frontend/common/views/dashboard/schedule/alerts/types";
import { resolveClassInstanceDashboardStatus } from "@/shared/lib/schedule/schedule-instance-dashboard-status";

function getTodayString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const ACTIVE_DASHBOARD_STATUSES: ReadonlySet<string> = new Set<string>([
  ClassExecutionState.Running,
  ClassExecutionState.Activated,
]);
const MISSED_DASHBOARD_STATUSES: ReadonlySet<string> = new Set<string>([ClassOutcome.Absent, ClassOutcome.Leave]);

function mapRowToSessionStatus(
  outcome: string | null | undefined,
  executionState: string | null | undefined,
  isFrozen: boolean | null | undefined,
  scheduledEndAt?: string | null
): ClassSessionStatus {
  if (isFrozen) return "hold";

  const displayStatus = resolveClassInstanceDashboardStatus(outcome, executionState, undefined, undefined, {
    scheduledEndAt: scheduledEndAt ?? undefined,
  });

  if (ACTIVE_DASHBOARD_STATUSES.has(displayStatus)) {
    return "active";
  }
  if (MISSED_DASHBOARD_STATUSES.has(displayStatus)) {
    return "missed";
  }
  return "upcoming";
}

function mapOutcomeToAction(outcome: string | null | undefined, status: ClassSessionStatus): ClassSessionAction {
  if (status === "hold") return "contact_admin";
  if (status === "missed") return "view_class_audit";
  if (outcome?.toLowerCase() === "taken") return "leave_disabled";
  return "leave_enabled";
}

export function buildScheduleQueryInput(page: number, pageSize: number) {
  return {
    date: getTodayString(),
    teacherId: null,
    search: null,
    metricFilter: null,
    paginationArgs: {
      first: pageSize,
      page: page + 1,
      skip: null,
      after: null,
      before: null,
      last: null,
      maxCount: null,
    },
  };
}

export function mapScheduleRowsToClasses(rows: ScheduleRow[] | null | undefined): AcademicClassRow[] {
  return (rows ?? []).map(row => {
    const status = mapRowToSessionStatus(row?.outcome, row?.executionState, row?.isFrozen, row?.scheduledEndAt);
    return {
      id: row?.id ?? "",
      className: row?.courseName?.trim() ?? row?.student?.name ?? "—",
      classId: row?.id ?? "",
      classAvatarUrl: row?.avatarUrl ?? null,
      instructor: row?.teacher?.name ?? "",
      instructorId: row?.teacher?.id ?? undefined,
      time: row?.yourTime ?? "",
      room: "",
      action: mapOutcomeToAction(row?.outcome, status),
      sessionStatus: status,
      executionState: row?.executionState,
      outcome: row?.outcome,
      isFrozen: row?.isFrozen ?? false,
      meetingJoinUrl: row?.meetingJoinUrl,
      effectiveMeeting: row?.effectiveMeeting,
    };
  });
}

type ScheduleResultMetrics = {
  total?: number | null;
  regular?: number | null;
};

export function buildScheduleAlertMetrics(m: ScheduleResultMetrics | null | undefined): AlertsMetric[] {
  if (!m) return [];
  return [
    {
      key: "totalStudents",
      value: m.total ?? 0,
      labelKey: "totalStudents",
      subLabelKey: "totalStudentsTrend",
      icon: PeopleOutlined,
      trend: undefined,
    },
    {
      key: "activeCourses",
      value: m.regular ?? 0,
      labelKey: "activeCourses",
      subLabelKey: "activeCoursesSub",
      icon: SchoolOutlined,
      trend: undefined,
    },
  ];
}

export function resolveScheduleTotalCount(
  scheduleResult: { pageInfo?: { total?: number | null } | null; totalCount?: number | null } | null | undefined
): number | undefined {
  return scheduleResult ? (scheduleResult.pageInfo?.total ?? scheduleResult.totalCount ?? 0) : undefined;
}
