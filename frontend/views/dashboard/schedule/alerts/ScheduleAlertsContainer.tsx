"use client";

import { useQuery } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission, ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";
import type { AdminDashboardScheduleQuery_adminDashboardSchedule_AdminDashboardScheduleResult_rows_DailyScheduleList as ScheduleRow } from "@/frontend/graphql/generated/gql/operations";
import { adminDashboardScheduleQueryDocument } from "@/frontend/graphql/sharedDocuments";
import { useScheduleAlertsStore } from "@/frontend/stores/scheduleAlertsStore";
import { ScheduleAlertsView } from "@/frontend/views/dashboard/schedule/alerts/ScheduleAlertsView";
import type {
  AcademicClassRow,
  AlertsMetric,
  ClassSessionAction,
  ClassSessionStatus,
  ScheduleAlert,
} from "@/frontend/views/dashboard/schedule/alerts/types";
import { useRouter } from "@/shared/i18n/routing";
import { resolveClassInstanceDashboardStatus } from "@/shared/lib/schedule/schedule-instance-dashboard-status";

type TranslationFn = ReturnType<typeof useTranslations<"dashboard.scheduleAlerts">>;

function getTodayString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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

  if (displayStatus === ClassExecutionState.Running || displayStatus === ClassExecutionState.Activated) {
    return "active";
  }
  if (displayStatus === ClassOutcome.Absent || displayStatus === ClassOutcome.Leave) {
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
      className: row?.student?.name ?? "",
      classId: row?.id ?? "",
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

function buildScheduleLabels(t: TranslationFn) {
  return {
    pageTitle: t("pageTitle"),
    pageSubtitle: t("pageSubtitle"),
    alertMessages: {
      leave_quota_exceeded: t("alerts.leaveQuotaExceeded"),
      missed_class_time: t("alerts.missedClassTime"),
    },
    reportTitle: t("report.title"),
    reportDescription: t("report.description"),
    reportDescriptionMobile: t("report.descriptionMobile"),
    downloadPdf: t("report.downloadPdf"),
    sectionTitle: t("section.title"),
    sectionSubtitle: t("section.subtitle"),
    filter: t("actions.filter"),
    export: t("actions.export"),
    className: t("table.className"),
    instructor: t("table.instructor"),
    time: t("table.time"),
    room: t("table.room"),
    status: t("table.status"),
    joinSession: t("actions.joinSession"),
    leaveClass: t("actions.leaveClass"),
    leaveDisabledReason: t("actions.leaveDisabledReason"),
    viewClassAudit: t("actions.viewClassAudit"),
    contactAdmin: t("actions.contactAdmin"),
    showingOf: t.raw("showingOf") as string,
    active: t("sessionStatus.active"),
    upcoming: t("sessionStatus.upcoming"),
    missed: t("sessionStatus.missed"),
    hold: t("sessionStatus.hold"),
    endOfSchedule: t("endOfSchedule"),
    noEntries: t("noEntries"),
    loading: t("loading"),
  };
}

export function ScheduleAlertsContainer() {
  const t = useTranslations("dashboard.scheduleAlerts");
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
  const totalCount = scheduleResult ? (scheduleResult.pageInfo?.total ?? scheduleResult.totalCount ?? 0) : undefined;

  const alerts: ScheduleAlert[] = [];
  const metrics: AlertsMetric[] = [];
  const labels = buildScheduleLabels(t);

  const metricLabels = Object.fromEntries(
    metrics.map(metric => [
      metric.key,
      {
        label: t(metric.labelKey.replace("dashboard.scheduleAlerts.", "")),
        subLabel: t(metric.subLabelKey.replace("dashboard.scheduleAlerts.", "")),
      },
    ])
  );

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLeave = (id: string) => {
    router.push(`/reschedule?classInstanceId=${id}`);
  };

  const handleViewClassAudit = (id: string) => {
    router.push(`/classes/${id}/audit`);
  };

  return (
    <RequirePermission permissions={[AppPermission.ScheduleViewList]}>
      <ScheduleAlertsView
        alerts={alerts}
        metrics={metrics}
        metricLabels={metricLabels}
        classes={classes}
        totalClasses={totalCount}
        currentPage={page}
        pageSize={pageSize}
        labels={labels}
        onLeave={handleLeave}
        onViewClassAudit={handleViewClassAudit}
        onPageChange={handlePageChange}
        loading={loading}
        onDownloadReport={() => {}}
        onFilter={() => {}}
        onExport={() => {}}
      />
    </RequirePermission>
  );
}
