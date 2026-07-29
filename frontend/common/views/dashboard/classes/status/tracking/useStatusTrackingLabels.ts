"use client";

import type { StatusTrackingLabels } from "@/frontend/common/views/dashboard/classes/status/tracking/status-tracking.types";
import type { StatusTrackingLabelsBySection } from "@/frontend/common/views/dashboard/classes/status/tracking/types/statusTrackingViewModel.types";
import { Translation, useAppTranslation } from "@/shared/locale";

function buildCardListLabels(labels: StatusTrackingLabels): StatusTrackingLabelsBySection["cardList"] {
  return {
    joinSession: labels.joinSession,
    activate: labels.activate,
    reschedule: labels.reschedule,
    verifyDocuments: labels.verifyDocuments,
    sessionLocked: labels.sessionLocked,
    sessionEnded: labels.sessionEnded,
    todaysSchedule: labels.todaysSchedule,
    regular: labels.regular,
    suspendedPending: labels.suspendedPending,
    onLeave: labels.onLeave,
    pendingVerification: labels.pendingVerification,
    noEntries: labels.noEntries,
  };
}

function buildAnalyticsLabels(labels: StatusTrackingLabels): StatusTrackingLabelsBySection["analytics"] {
  return {
    suspensionAnalytics: labels.suspensionAnalytics,
    analyticsNote: labels.analyticsNote,
    urgentTask: labels.urgentTask,
    accountsLocked: labels.accountsLocked,
    auditDescription: labels.auditDescription,
    openAuditLogs: labels.openAuditLogs,
    suspended: labels.suspendedPending,
    days: labels.days,
  };
}

function buildColumnLabels(labels: StatusTrackingLabels): StatusTrackingLabelsBySection["columns"] {
  return {
    studentClass: labels.studentClass,
    teacher: labels.teacher,
    schedule: labels.schedule,
    status: labels.status,
    actions: labels.actions,
    joinSession: labels.joinSession,
    activate: labels.activate,
    reschedule: labels.reschedule,
    verifyDocuments: labels.verifyDocuments,
    administrativeHold: labels.administrativeHold,
    holdDescription: labels.holdDescription,
    regular: labels.regular,
    suspendedPending: labels.suspendedPending,
    onLeave: labels.onLeave,
    pendingVerification: labels.pendingVerification,
    sessionEnded: labels.sessionEnded,
    noEntries: labels.noEntries,
    showingOf: labels.showingOf,
    previous: labels.previous,
    next: labels.next,
  };
}

export function buildStatusTrackingLabelsBySection(labels: StatusTrackingLabels): StatusTrackingLabelsBySection {
  return {
    shell: {
      pageTitle: labels.pageTitle,
      pageSubtitle: labels.pageSubtitle,
      filters: labels.filters,
      newReport: labels.newReport,
      todaysClassSchedule: labels.todaysClassSchedule,
      totalSessions: labels.totalSessions,
      seeAll: labels.seeAll,
      todaysSchedule: labels.todaysSchedule,
    },
    filters: {
      dateFilter: labels.dateFilter,
    },
    columns: buildColumnLabels(labels),
    cardList: buildCardListLabels(labels),
    analytics: buildAnalyticsLabels(labels),
    notifications: {
      errorNoStudentId: labels.errorNoStudentId,
      errorAuditLogsComingSoon: labels.errorAuditLogsComingSoon,
      errorFailedToLoad: labels.errorFailedToLoad,
    },
    metrics: {
      regularSubLabel: labels.regularSubLabel,
      pendingSubLabel: labels.pendingSubLabel,
      suspendedSubLabel: labels.suspendedSubLabel,
      onLeaveSubLabel: labels.onLeaveSubLabel,
    },
  };
}

export function useStatusTrackingLabels(): StatusTrackingLabels {
  const t = useAppTranslation(Translation.Dashboard.CoreStatusTracking);

  return {
    pageTitle: t.pageTitle,
    pageSubtitle: t.pageSubtitle,
    filters: t.filters,
    newReport: t.newReport,
    todaysClassSchedule: t.todaysClassSchedule,
    totalSessions: (total: number) => t.totalSessions(total),
    studentClass: t.table.studentClass,
    teacher: t.table.teacher,
    schedule: t.table.schedule,
    status: t.table.status,
    actions: t.table.actions,
    showingOf: (shown: number, total: number) => t.showingOf(shown, total),
    previous: t.previous,
    next: t.next,
    joinSession: t.actions.joinSession,
    activate: t.actions.activate,
    reschedule: t.actions.reschedule,
    verifyDocuments: t.actions.verifyDocuments,
    sessionLocked: t.actions.sessionLocked,
    sessionEnded: t.actions.sessionEnded,
    administrativeHold: t.administrativeHold,
    holdDescription: t.holdDescription,
    seeAll: t.seeAll,
    todaysSchedule: t.todaysSchedule,
    regular: t.status.regular,
    suspendedPending: t.status.suspendedPending,
    onLeave: t.status.onLeave,
    pendingVerification: t.status.pendingVerification,
    regularSubLabel: t.subLabels.regular,
    pendingSubLabel: t.subLabels.pending,
    suspendedSubLabel: t.subLabels.suspended,
    onLeaveSubLabel: t.subLabels.onLeave,
    suspensionAnalytics: t.analytics.title,
    analyticsNote: t.analytics.note,
    urgentTask: t.analytics.urgentTask,
    accountsLocked: (count: number) => t.analytics.accountsLocked(count),
    auditDescription: t.analytics.auditDescription,
    openAuditLogs: t.analytics.openAuditLogs,
    noEntries: t.noEntries,
    errorNoStudentId: t.errors.noStudentId,
    errorAuditLogsComingSoon: t.errors.auditLogsComingSoon,
    errorFailedToLoad: t.errors.failedToLoad,
    days: [t.days.mon, t.days.tue, t.days.wed, t.days.thu, t.days.fri, t.days.sat, t.days.sun] as const,
    dateFilter: {
      today: t.dateFilter.today,
      previousDay: t.dateFilter.previousDay,
      nextDay: t.dateFilter.nextDay,
      dateLabel: t.dateFilter.dateLabel,
    },
  };
}
