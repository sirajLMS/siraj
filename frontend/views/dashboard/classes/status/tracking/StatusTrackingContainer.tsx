"use client";

import { useTranslations } from "next-intl";
import { useRescheduleStore } from "@/frontend/stores/mockRescheduleStore";
import { useStatusTrackingStore } from "@/frontend/stores/mockStatusTrackingStore";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import { useRouter } from "@/shared/i18n/routing";
import { StatusTrackingView } from "./StatusTrackingView";

export function StatusTrackingContainer() {
  const t = useTranslations("dashboard.statusTracking");
  const router = useRouter();
  const setRescheduleSession = useRescheduleStore(state => state.setSession);

  const rawMetrics = useStatusTrackingStore(state => state.metrics);
  const rows = useStatusTrackingStore(state => state.rows);
  const totalSessions = useStatusTrackingStore(state => state.totalSessions);
  const activateSession = useStatusTrackingStore(state => state.activateSession);
  const verifySession = useStatusTrackingStore(state => state.verifySession);

  const suspendedCount = Number(rawMetrics.find(m => m.key === "suspended")?.count ?? 0);

  const subLabelMap: Record<string, string> = {
    regular: t("subLabels.regular"),
    pending: t("subLabels.pending"),
    suspended: t("subLabels.suspended"),
    on_leave: t("subLabels.onLeave"),
  };

  const metrics: readonly MetricItem[] = rawMetrics.map(m => ({
    ...m,
    subLabel: subLabelMap[m.key],
  }));

  const labels = {
    pageTitle: t("pageTitle"),
    pageSubtitle: t("pageSubtitle"),
    filters: t("filters"),
    newReport: t("newReport"),
    todaysClassSchedule: t("todaysClassSchedule"),
    totalSessions: t.raw("totalSessions") as string,
    studentClass: t("table.studentClass"),
    teacher: t("table.teacher"),
    schedule: t("table.schedule"),
    status: t("table.status"),
    actions: t("table.actions"),
    showingOf: t.raw("showingOf") as string,
    previous: t("previous"),
    next: t("next"),
    joinSession: t("actions.joinSession"),
    activate: t("actions.activate"),
    reschedule: t("actions.reschedule"),
    verifyDocuments: t("actions.verifyDocuments"),
    sessionLocked: t("actions.sessionLocked"),
    administrativeHold: t("administrativeHold"),
    holdDescription: t("holdDescription"),
    seeAll: t("seeAll"),
    todaysSchedule: t("todaysSchedule"),
    regular: t("status.regular"),
    suspendedPending: t("status.suspendedPending"),
    onLeave: t("status.onLeave"),
    pendingVerification: t("status.pendingVerification"),
    regularSubLabel: t("subLabels.regular"),
    pendingSubLabel: t("subLabels.pending"),
    suspendedSubLabel: t("subLabels.suspended"),
    onLeaveSubLabel: t("subLabels.onLeave"),
    suspensionAnalytics: t("analytics.title"),
    analyticsNote: t("analytics.note"),
    urgentTask: t("analytics.urgentTask"),
    accountsLocked: t.raw("analytics.accountsLocked") as string,
    auditDescription: t("analytics.auditDescription"),
    openAuditLogs: t("analytics.openAuditLogs"),
    noEntries: t("noEntries"),
    days: [
      t("days.mon"),
      t("days.tue"),
      t("days.wed"),
      t("days.thu"),
      t("days.fri"),
      t("days.sat"),
      t("days.sun"),
    ] as const,
  };

  const handleNewReport = () => {
    // Navigate or open modal in future
  };

  const handleReschedule = (id: string) => {
    const row = rows.find(session => session.id === id);
    if (row) {
      setRescheduleSession({
        sessionId: id,
        teacherName: row.teacherName,
        studentName: row.studentName,
        teacherTimezone: "Africa/Cairo",
      });
    }
    router.push("/reschedule");
  };

  return (
    <StatusTrackingView
      metrics={metrics}
      rows={rows}
      totalSessions={totalSessions}
      suspendedCount={suspendedCount}
      labels={labels}
      onActivate={activateSession}
      onReschedule={handleReschedule}
      onVerify={verifySession}
      onNewReport={handleNewReport}
    />
  );
}
