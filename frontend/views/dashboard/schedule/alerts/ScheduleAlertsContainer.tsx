"use client";

import { useQuery } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { adminDashboardScheduleQueryDocument } from "@/frontend/graphql/sharedDocuments/schedule.documents";
import { useScheduleAlertsStore } from "@/frontend/stores/scheduleAlertsStore";
import { ClassExecutionState, ClassOutcome } from "@/shared/lib/enum";
import { resolveClassInstanceDashboardStatus } from "@/shared/lib/schedule-instance-dashboard-status";
import { ScheduleAlertsView } from "./ScheduleAlertsView";
import type { AcademicClassRow, AlertsMetric, ClassSessionAction, ClassSessionStatus, ScheduleAlert } from "./types";

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
  scheduledEndAt?: string | null
): ClassSessionStatus {
  const displayStatus = resolveClassInstanceDashboardStatus(outcome, executionState, undefined, undefined, {
    scheduledEndAt: scheduledEndAt ?? undefined,
  });

  if (displayStatus === ClassExecutionState.RUNNING || displayStatus === ClassExecutionState.ACTIVATED) {
    return "active";
  }
  if (displayStatus === ClassOutcome.ABSENT || displayStatus === ClassOutcome.LEAVE) {
    return "missed";
  }
  return "upcoming";
}

function mapOutcomeToAction(outcome: string | null | undefined, status: ClassSessionStatus): ClassSessionAction {
  if (status === "missed") return "view_recording";
  if (outcome?.toLowerCase() === "taken") return "leave_disabled";
  return "leave_enabled";
}

export function ScheduleAlertsContainer() {
  const t = useTranslations("dashboard.scheduleAlerts");

  const page = useScheduleAlertsStore(state => state.page);
  const pageSize = useScheduleAlertsStore(state => state.pageSize);
  const setPage = useScheduleAlertsStore(state => state.setPage);

  const { data, loading } = useQuery(adminDashboardScheduleQueryDocument, {
    variables: {
      input: {
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
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const scheduleResult = data?.adminDashboardSchedule;
  const metricsList: AlertsMetric[] = [];
  const classes: AcademicClassRow[] = (scheduleResult?.rows ?? []).map(row => {
    const status = mapRowToSessionStatus(row?.outcome, row?.executionState, row?.scheduledEndAt);
    return {
      id: row?.id ?? "",
      className: row?.student?.name ?? "",
      classId: row?.id ?? "",
      instructor: row?.teacher?.name ?? "",
      time: row?.yourTime ?? "",
      room: "",
      action: mapOutcomeToAction(row?.outcome, status),
      sessionStatus: status,
    };
  });
  const totalCount = scheduleResult?.pageInfo?.total ?? scheduleResult?.totalCount ?? 0;

  const alerts: ScheduleAlert[] = [];

  const metrics: AlertsMetric[] = metricsList;

  const metricLabels = Object.fromEntries(
    metrics.map(metric => [
      metric.key,
      {
        label: t(metric.labelKey.replace("dashboard.scheduleAlerts.", "")),
        subLabel: t(metric.subLabelKey.replace("dashboard.scheduleAlerts.", "")),
      },
    ])
  );

  const labels = {
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
    viewRecording: t("actions.viewRecording"),
    showingOf: t.raw("showingOf") as string,
    active: t("sessionStatus.active"),
    upcoming: t("sessionStatus.upcoming"),
    missed: t("sessionStatus.missed"),
    endOfSchedule: t("endOfSchedule"),
    noEntries: t("noEntries"),
    loading: t("loading"),
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleJoin = (_id: string) => {};
  const handleLeave = (_id: string) => {};

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
        onJoin={handleJoin}
        onLeave={handleLeave}
        onPageChange={handlePageChange}
        loading={loading}
        onDownloadReport={() => {}}
        onFilter={() => {}}
        onExport={() => {}}
      />
    </RequirePermission>
  );
}
