"use client";

import { useQuery } from "@apollo/client/react";
import type { SvgIconComponent } from "@mui/icons-material";
import {
  BlockOutlined,
  CheckCircleOutlineOutlined,
  EventAvailableOutlined,
  PendingActionsOutlined,
} from "@mui/icons-material";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { statusTrackingScheduleQueryDocument } from "@/frontend/graphql/sharedDocuments/schedule.documents";
import { useRescheduleStore } from "@/frontend/stores/mockRescheduleStore";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import { useRouter } from "@/shared/i18n/routing";
import { StatusTrackingView } from "./StatusTrackingView";
import { computeSessionStatus, type StatusTrackingRow } from "./types";

export function StatusTrackingContainer() {
  const t = useTranslations("dashboard.statusTracking");
  const router = useRouter();
  const setRescheduleSession = useRescheduleStore(state => state.setSession);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const { data } = useQuery(statusTrackingScheduleQueryDocument, {
    variables: { date: today, search: null, viewerTimezone: null },
    fetchPolicy: "cache-and-network",
  });

  const rows: readonly StatusTrackingRow[] = useMemo(
    () => data?.statusTrackingSchedule ?? [],
    [data?.statusTrackingSchedule]
  );
  const totalSessions = rows.length;

  const suspendedCount = useMemo(
    () =>
      rows.filter(r => computeSessionStatus(r.studentStatus, r.isFrozen, r.executionState) === "suspended_pending")
        .length,
    [rows]
  );

  const metricCounts = useMemo(() => {
    const counts = { regular: 0, pending: 0, suspended: 0, on_leave: 0 };
    for (const row of rows) {
      const status = computeSessionStatus(row.studentStatus, row.isFrozen, row.executionState);
      if (status === "regular") counts.regular += 1;
      else if (status === "pending_verification") counts.pending += 1;
      else if (status === "suspended_pending") counts.suspended += 1;
      else if (status === "on_leave") counts.on_leave += 1;
    }
    return counts;
  }, [rows]);

  const subLabelMap: Record<string, string> = {
    regular: t("subLabels.regular"),
    pending: t("subLabels.pending"),
    suspended: t("subLabels.suspended"),
    on_leave: t("subLabels.onLeave"),
  };

  const rawMetrics: readonly {
    key: string;
    count: number;
    labelKey: string;
    icon: SvgIconComponent;
    variant?: MetricItem["variant"];
  }[] = [
    {
      key: "regular",
      count: metricCounts.regular,
      labelKey: "dashboard.statusTracking.metrics.regular",
      icon: CheckCircleOutlineOutlined,
    },
    {
      key: "pending",
      count: metricCounts.pending,
      labelKey: "dashboard.statusTracking.metrics.pending",
      icon: PendingActionsOutlined,
    },
    {
      key: "suspended",
      count: metricCounts.suspended,
      labelKey: "dashboard.statusTracking.metrics.suspended",
      icon: BlockOutlined,
      variant: "error",
    },
    {
      key: "on_leave",
      count: metricCounts.on_leave,
      labelKey: "dashboard.statusTracking.metrics.onLeave",
      icon: EventAvailableOutlined,
    },
  ];

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

  const handleActivate = (_id: string) => {
    // Admin-only activation — future sprint wires up the mutation
  };

  const handleReschedule = (id: string) => {
    const row = rows.find(session => session.id === id);
    if (row) {
      setRescheduleSession({
        sessionId: id,
        teacherName: row.teacherName ?? "",
        studentName: row.studentName ?? "",
        teacherTimezone: "Africa/Cairo",
      });
    }
    router.push("/reschedule");
  };

  const handleVerify = (_id: string) => {
    // Document verification — future sprint
  };

  return (
    <StatusTrackingView
      metrics={metrics}
      rows={rows}
      totalSessions={totalSessions}
      suspendedCount={suspendedCount}
      labels={labels}
      onActivate={handleActivate}
      onReschedule={handleReschedule}
      onVerify={handleVerify}
      onNewReport={handleNewReport}
    />
  );
}
