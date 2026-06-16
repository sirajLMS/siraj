"use client";

import { useTranslations } from "next-intl";
import { useRescheduleTrackingStore } from "@/frontend/stores/rescheduleTrackingStore";
import { RescheduleTrackingView } from "./RescheduleTrackingView";

export function RescheduleTrackingContainer() {
  const t = useTranslations("dashboard.rescheduleTracking");

  const metrics = useRescheduleTrackingStore(state => state.metrics);
  const rows = useRescheduleTrackingStore(state => state.rows);
  const pagination = useRescheduleTrackingStore(state => state.pagination);
  const approveLeave = useRescheduleTrackingStore(state => state.approveLeave);
  const rejectLeave = useRescheduleTrackingStore(state => state.rejectLeave);

  // Build labels object from translations
  const labels = {
    pageTitle: t("pageTitle"),
    sectionTitle: t("sectionTitle"),
    exportData: t("exportData"),
    filter: t("filter"),
    teacherName: t("table.teacherName"),
    studentClass: t("table.studentClass"),
    scheduledDate: t("table.scheduledDate"),
    timeSlot: t("table.timeSlot"),
    classStatus: t("table.classStatus"),
    action: t("table.action"),
    newDate: t("badges.newDate"),
    leaveRequest: t("badges.leaveRequest"),
    rescheduled: t("status.rescheduled"),
    pendingLeave: t("status.pendingLeave"),
    viewDetails: t("actions.viewDetails"),
    approveLeave: t("actions.approveLeave"),
    rejectLeave: t("actions.rejectLeave"),
    showingOf: t.raw("showingOf") as string,
    noEntries: t("noEntries"),
  };

  const handleApprove = (id: string) => {
    approveLeave(id);
  };

  const handleReject = (id: string) => {
    rejectLeave(id);
  };

  const handleView = (_id: string) => {
    // Navigate to class detail page in future
  };

  const handleExport = () => {
    // Export logic in future
  };

  return (
    <RescheduleTrackingView
      metrics={metrics}
      rows={rows}
      totalItems={pagination.totalItems}
      labels={labels}
      onApprove={handleApprove}
      onReject={handleReject}
      onView={handleView}
      onExport={handleExport}
    />
  );
}
