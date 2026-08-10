"use client";

import { useQuery } from "@apollo/client/react";
import { PeopleOutlined, SchoolOutlined } from "@mui/icons-material";
import { useCallback, useMemo } from "react";
import { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { AdminDashboardScheduleQuery_adminDashboardSchedule_AdminDashboardScheduleResult_rows_DailyScheduleList as ScheduleRow } from "@/frontend/common/graphql/generated/gql/operations";
import { adminDashboardScheduleQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useScheduleAlertsStore } from "@/frontend/common/stores/scheduleAlertsStore";
import type {
  AcademicClassRow,
  AlertsMetric,
  ClassSessionAction,
  ClassSessionStatus,
  ScheduleAlert,
} from "@/frontend/common/views/dashboard/schedule/alerts/types";
import { useRouter } from "@/shared/i18n/navigation";
import { resolveClassInstanceDashboardStatus } from "@/shared/lib/schedule/schedule-instance-dashboard-status";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { ScheduleAlertsLabels } from "@/shared/locale/types/dashboard/core/scheduleAlerts";

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

function buildScheduleQueryInput(page: number, pageSize: number) {
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

function mapScheduleRowsToClasses(rows: ScheduleRow[] | null | undefined): AcademicClassRow[] {
  return (rows ?? []).map(row => {
    const status = mapRowToSessionStatus(row?.outcome, row?.executionState, row?.isFrozen, row?.scheduledEndAt);
    return {
      id: row?.id ?? "",
      className: row?.courseName?.trim() || row?.student?.name || "—",
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

function buildScheduleLabels(t: ScheduleAlertsLabels) {
  return {
    pageTitle: t.pageTitle,
    pageSubtitle: t.pageSubtitle,
    alertMessages: {
      leave_quota_exceeded: t.alerts.leaveQuotaExceeded,
      missed_class_time: t.alerts.missedClassTime,
    },
    reportTitle: t.report.title,
    reportDescription: t.report.description,
    reportDescriptionMobile: t.report.descriptionMobile,
    downloadPdf: t.report.downloadPdf,
    sectionTitle: t.section.title,
    sectionSubtitle: t.section.subtitle,
    filter: t.actions.filter,
    export: t.actions.export,
    className: t.table.className,
    instructor: t.table.instructor,
    time: t.table.time,
    room: t.table.room,
    status: t.table.status,
    joinSession: t.actions.joinSession,
    leaveClass: t.actions.leaveClass,
    leaveDisabledReason: t.actions.leaveDisabledReason,
    viewClassAudit: t.actions.viewClassAudit,
    contactAdmin: t.actions.contactAdmin,
    showingOf: t.showingOf,
    active: t.sessionStatus.active,
    upcoming: t.sessionStatus.upcoming,
    missed: t.sessionStatus.missed,
    hold: t.sessionStatus.hold,
    endOfSchedule: t.endOfSchedule,
    noEntries: t.noEntries,
    loading: t.loading,
  };
}

type MetricLabelKey = keyof ScheduleAlertsLabels["metrics"];

function isMetricLabelKey(key: string): key is MetricLabelKey {
  return (
    key === "totalStudents" || key === "totalStudentsTrend" || key === "activeCourses" || key === "activeCoursesSub"
  );
}

function buildMetricLabels(metrics: readonly AlertsMetric[], t: ScheduleAlertsLabels) {
  return Object.fromEntries(
    metrics.map(metric => [
      metric.key,
      {
        label: isMetricLabelKey(metric.labelKey) ? t.metrics[metric.labelKey] : "",
        subLabel: isMetricLabelKey(metric.subLabelKey) ? t.metrics[metric.subLabelKey] : "",
      },
    ])
  );
}

type ScheduleResultMetrics = {
  total?: number | null;
  regular?: number | null;
};

function buildScheduleAlertMetrics(m: ScheduleResultMetrics | null | undefined): AlertsMetric[] {
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

function resolveScheduleTotalCount(
  scheduleResult: { pageInfo?: { total?: number | null } | null; totalCount?: number | null } | null | undefined
): number | undefined {
  return scheduleResult ? (scheduleResult.pageInfo?.total ?? scheduleResult.totalCount ?? 0) : undefined;
}

function useScheduleAlertsHandlers(setPage: (page: number) => void, router: ReturnType<typeof useRouter>) {
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
    },
    [setPage]
  );

  const handleLeave = useCallback(
    (id: string) => {
      router.push(`/schedule/tracking/reschedule?classInstanceId=${id}`);
    },
    [router]
  );

  const handleViewClassAudit = useCallback(
    (id: string) => {
      router.push(`/classes/${id}/audit`);
    },
    [router]
  );

  return { handlePageChange, handleLeave, handleViewClassAudit };
}

interface ScheduleAlertsViewModelParams {
  readonly alerts: ScheduleAlert[];
  readonly metrics: AlertsMetric[];
  readonly metricLabels: Record<string, { label: string; subLabel: string }>;
  readonly classes: AcademicClassRow[];
  readonly totalCount: number | undefined;
  readonly page: number;
  readonly pageSize: number;
  readonly labels: ReturnType<typeof buildScheduleLabels>;
  readonly loading: boolean;
  readonly handlers: ReturnType<typeof useScheduleAlertsHandlers>;
}

function buildScheduleAlertsViewModelResult(params: ScheduleAlertsViewModelParams): ScheduleAlertsViewModel {
  const { handlers, alerts, metrics, metricLabels, classes, totalCount, page, pageSize, labels, loading } = params;
  return {
    alerts,
    metrics,
    metricLabels,
    classes,
    totalClasses: totalCount,
    currentPage: page,
    pageSize,
    labels,
    loading,
    onLeave: handlers.handleLeave,
    onViewClassAudit: handlers.handleViewClassAudit,
    onPageChange: handlers.handlePageChange,
    onDownloadReport: () => {},
    onFilter: () => {},
    onExport: () => {},
  };
}

export interface ScheduleAlertsViewModel {
  readonly alerts: readonly ScheduleAlert[];
  readonly metrics: readonly AlertsMetric[];
  readonly metricLabels: Record<string, { label: string; subLabel: string }>;
  readonly classes: readonly AcademicClassRow[];
  readonly totalClasses?: number;
  readonly currentPage: number;
  readonly pageSize: number;
  readonly labels: ReturnType<typeof buildScheduleLabels>;
  readonly loading: boolean;
  readonly onLeave: (id: string) => void;
  readonly onViewClassAudit: (id: string) => void;
  readonly onPageChange: (page: number) => void;
  readonly onDownloadReport: () => void;
  readonly onFilter: () => void;
  readonly onExport: () => void;
}

export interface UseScheduleAlertsViewModelProps {
  readonly page?: number;
  readonly pageSize?: number;
}

export function useScheduleAlertsViewModel(): ScheduleAlertsViewModel {
  const t = useAppTranslation(Translation.Dashboard.CoreScheduleAlerts);
  const router = useRouter();

  const page = useScheduleAlertsStore(state => state.page);
  const pageSize = useScheduleAlertsStore(state => state.pageSize);
  const setPage = useScheduleAlertsStore(state => state.setPage);

  const { data, loading } = useQuery(adminDashboardScheduleQueryDocument, {
    variables: { input: buildScheduleQueryInput(page, pageSize) },
    fetchPolicy: "cache-and-network",
  });

  const scheduleResult = data?.adminDashboardSchedule;
  const classes = mapScheduleRowsToClasses(scheduleResult?.rows);
  const totalCount = resolveScheduleTotalCount(scheduleResult);

  const alerts: ScheduleAlert[] = [];

  const metrics = useMemo(() => buildScheduleAlertMetrics(scheduleResult?.metrics), [scheduleResult?.metrics]);

  const labels = buildScheduleLabels(t);
  const metricLabels = buildMetricLabels(metrics, t);

  const handlers = useScheduleAlertsHandlers(setPage, router);

  return buildScheduleAlertsViewModelResult({
    alerts,
    metrics,
    metricLabels,
    classes,
    totalCount,
    page,
    pageSize,
    labels,
    loading,
    handlers,
  });
}
