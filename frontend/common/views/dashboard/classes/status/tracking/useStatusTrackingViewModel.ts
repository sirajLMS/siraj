"use client";

import { useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useMemo } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { statusTrackingScheduleQueryDocument } from "@/frontend/common/graphql/sharedDocuments/scheduling/schedule.documents";
import { useRescheduleStore } from "@/frontend/common/stores/rescheduleStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import type {
  CardListLabels,
  DesktopLayoutProps,
  MobileLayoutProps,
  StatusTrackingLabels,
  StatusTrackingRow,
  SuspensionAnalyticsLabels,
} from "@/frontend/common/views/dashboard/classes/status/tracking/types";
import { useStatusTrackingLabels } from "@/frontend/common/views/dashboard/classes/status/tracking/useStatusTrackingLabels";
import { useStatusTrackingMetrics } from "@/frontend/common/views/dashboard/classes/status/tracking/useStatusTrackingMetrics";
import { useRouter } from "@/shared/i18n/routing";

export interface StatusTrackingViewModel extends MobileLayoutProps, DesktopLayoutProps {}

export interface UseStatusTrackingViewModelProps {
  readonly onActivate?: (id: string) => void;
  readonly onReschedule?: (id: string) => void;
  readonly onVerify?: (id: string) => void;
  readonly onNewReport?: () => void;
  readonly onOpenAuditLogs?: () => void;
  readonly onSeeAll?: () => void;
}

function buildCardListLabels(labels: StatusTrackingLabels): CardListLabels {
  return {
    joinSession: labels.joinSession,
    activate: labels.activate,
    reschedule: labels.reschedule,
    verifyDocuments: labels.verifyDocuments,
    sessionLocked: labels.sessionLocked,
    sessionEnded: labels.sessionEnded,
    seeAll: labels.seeAll,
    todaysSchedule: labels.todaysSchedule,
    regular: labels.regular,
    suspendedPending: labels.suspendedPending,
    onLeave: labels.onLeave,
    pendingVerification: labels.pendingVerification,
  };
}

function buildAnalyticsLabels(labels: StatusTrackingLabels): SuspensionAnalyticsLabels {
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

export function useStatusTrackingViewModel(props: Readonly<UseStatusTrackingViewModelProps>): StatusTrackingViewModel {
  const { onActivate, onReschedule, onVerify, onNewReport, onOpenAuditLogs, onSeeAll } = props;
  const router = useRouter();
  const setRescheduleSession = useRescheduleStore(state => state.setSession);
  const hasPermission = useUserStore(state => state.hasPermission);
  const labels = useStatusTrackingLabels();
  const notifications = useNotifications();

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const { data } = useQuery(statusTrackingScheduleQueryDocument, {
    variables: { date: today, search: null, viewerTimezone: null },
    fetchPolicy: "cache-and-network",
  });

  const rows: readonly StatusTrackingRow[] = useMemo(
    () => data?.statusTrackingSchedule ?? [],
    [data?.statusTrackingSchedule]
  );

  const { metrics, suspendedCount } = useStatusTrackingMetrics(rows);

  const handleReschedule = useCallback(
    (id: string) => {
      const row = rows.find(session => session.id === id);
      if (row) {
        setRescheduleSession({
          sessionId: id,
          teacherName: row.teacherName ?? "",
          studentName: row.studentName ?? "",
          teacherTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      }
      router.push(`/reschedule?classInstanceId=${id}`);
    },
    [rows, setRescheduleSession, router]
  );

  const handleActivate = useCallback(
    (id: string) => {
      if (!hasPermission(AppPermission.SessionActivateClass)) {
        return;
      }
      const row = rows.find(session => session.id === id);
      if (!row || row.isFrozen) {
        return;
      }
      router.push(`/classes/${id}`);
    },
    [rows, hasPermission, router]
  );

  const handleVerify = useCallback(
    (id: string) => {
      const row = rows.find(session => session.id === id);
      const studentId = row?.studentId;
      if (studentId) {
        router.push(studentProfileTabHref(studentId, "status"));
      } else {
        notifications.show(labels.errorNoStudentId, { severity: "warning", autoHideDuration: 4000 });
      }
    },
    [rows, router, notifications, labels]
  );

  const handleNewReport = useCallback(() => {
    router.push("/classes/new");
  }, [router]);

  const handleOpenAuditLogs = useCallback(() => {
    notifications.show(labels.errorAuditLogsComingSoon, { severity: "info", autoHideDuration: 4000 });
  }, [notifications, labels]);

  const handleSeeAll = useCallback(() => {
    router.push("/schedule");
  }, [router]);

  const cardListLabels = useMemo(() => buildCardListLabels(labels), [labels]);
  const analyticsLabels = useMemo(() => buildAnalyticsLabels(labels), [labels]);

  return {
    metrics,
    rows,
    totalSessions: rows.length,
    suspendedCount,
    labels,
    onActivate: onActivate ?? handleActivate,
    onReschedule: onReschedule ?? handleReschedule,
    onVerify: onVerify ?? handleVerify,
    onNewReport: onNewReport ?? handleNewReport,
    onOpenAuditLogs: onOpenAuditLogs ?? handleOpenAuditLogs,
    onSeeAll: onSeeAll ?? handleSeeAll,
    cardListLabels,
    analyticsLabels,
  };
}
