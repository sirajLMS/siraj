"use client";

import { useTranslations } from "next-intl";
import { useScheduleAlertsStore } from "@/frontend/stores/scheduleAlertsStore";
import { ScheduleAlertsView } from "./ScheduleAlertsView";

export function ScheduleAlertsContainer() {
  const t = useTranslations("dashboard.scheduleAlerts");

  const alerts = useScheduleAlertsStore(state => state.alerts);
  const metrics = useScheduleAlertsStore(state => state.metrics);
  const classes = useScheduleAlertsStore(state => state.classes);
  const totalClasses = useScheduleAlertsStore(state => state.totalClasses);
  const currentPage = useScheduleAlertsStore(state => state.currentPage);
  const pageSize = useScheduleAlertsStore(state => state.pageSize);
  const joinSession = useScheduleAlertsStore(state => state.joinSession);
  const leaveClass = useScheduleAlertsStore(state => state.leaveClass);
  const setPage = useScheduleAlertsStore(state => state.setPage);

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
  };

  return (
    <ScheduleAlertsView
      alerts={alerts}
      metrics={metrics}
      metricLabels={metricLabels}
      classes={classes}
      totalClasses={totalClasses}
      currentPage={currentPage}
      pageSize={pageSize}
      labels={labels}
      onJoin={joinSession}
      onLeave={leaveClass}
      onPageChange={setPage}
      onDownloadReport={() => {
        // Download report logic in future
      }}
      onFilter={() => {
        // Filter logic in future
      }}
      onExport={() => {
        // Export logic in future
      }}
    />
  );
}
