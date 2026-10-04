import type { AlertsMetric } from "@/frontend/common/views/dashboard/schedule/alerts/types";
import type { ScheduleAlertsLabels } from "@/shared/locale/types/dashboard/core/scheduleAlerts";

export function buildScheduleLabels(t: ScheduleAlertsLabels) {
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

export function buildMetricLabels(metrics: readonly AlertsMetric[], t: ScheduleAlertsLabels) {
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
