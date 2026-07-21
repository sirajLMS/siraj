"use client";

import { useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useMemo } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { statusTrackingScheduleQueryDocument } from "@/frontend/common/graphql/sharedDocuments/scheduling/schedule.documents";
import { resolveBrowserIanaTimezoneId, toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import { useRescheduleStore } from "@/frontend/common/stores/rescheduleStore";
import { useStatusTrackingStore } from "@/frontend/common/stores/statusTrackingStore";
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
import { useRouter } from "@/shared/i18n/navigation";

type RouterLike = ReturnType<typeof useRouter>;
type NotificationsLike = ReturnType<typeof useNotifications>;
type HasPermissionFn = (permission: AppPermission) => boolean;
type SetRescheduleSessionFn = (session: {
  readonly sessionId: string;
  readonly teacherName: string;
  readonly studentName: string;
  readonly teacherTimezone: string;
}) => void;

export interface StatusTrackingViewModel extends MobileLayoutProps, DesktopLayoutProps {}

export interface UseStatusTrackingViewModelProps {
  readonly onActivate?: (id: string) => void;
  readonly onReschedule?: (id: string) => void;
  readonly onVerify?: (id: string) => void;
  readonly onNewReport?: () => void;
  readonly onOpenAuditLogs?: () => void;
}

function buildCardListLabels(labels: StatusTrackingLabels): CardListLabels {
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

function buildRescheduleHandler(
  rows: readonly StatusTrackingRow[],
  setRescheduleSession: SetRescheduleSessionFn,
  router: RouterLike
) {
  return (id: string) => {
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
  };
}

function buildActivateHandler(rows: readonly StatusTrackingRow[], hasPermission: HasPermissionFn, router: RouterLike) {
  return (id: string) => {
    if (!hasPermission(AppPermission.SessionActivateClass)) {
      return;
    }
    const row = rows.find(session => session.id === id);
    if (!row || row.isFrozen) {
      return;
    }
    router.push(`/classes/${id}`);
  };
}

function buildVerifyHandler(
  rows: readonly StatusTrackingRow[],
  router: RouterLike,
  notifications: NotificationsLike,
  errorNoStudentId: string
) {
  return (id: string) => {
    const row = rows.find(session => session.id === id);
    const studentId = row?.studentId;
    if (studentId) {
      router.push(studentProfileTabHref(studentId, "status"));
    } else {
      notifications.show(errorNoStudentId, { severity: "warning", autoHideDuration: 4000 });
    }
  };
}

export function useStatusTrackingViewModel(props: Readonly<UseStatusTrackingViewModelProps>): StatusTrackingViewModel {
  const { onActivate, onReschedule, onVerify, onNewReport, onOpenAuditLogs } = props;
  const router = useRouter();
  const setRescheduleSession = useRescheduleStore(state => state.setSession);
  const hasPermission = useUserStore(state => state.hasPermission);
  const selectedDate = useStatusTrackingStore(state => state.selectedDate);
  const setSelectedDate = useStatusTrackingStore(state => state.setSelectedDate);
  const labels = useStatusTrackingLabels();
  const notifications = useNotifications();

  const viewerTimezone = useMemo(() => toGraphqlIanaTimezone(resolveBrowserIanaTimezoneId()), []);

  const { data } = useQuery(statusTrackingScheduleQueryDocument, {
    variables: { date: selectedDate, search: null, viewerTimezone },
    fetchPolicy: "cache-and-network",
  });

  const rows: readonly StatusTrackingRow[] = useMemo(
    () => data?.statusTrackingSchedule ?? [],
    [data?.statusTrackingSchedule]
  );

  const { metrics, suspendedCount } = useStatusTrackingMetrics(rows);

  const handleReschedule = useCallback(
    () => buildRescheduleHandler(rows, setRescheduleSession, router),
    [rows, setRescheduleSession, router]
  );

  const handleActivate = useCallback(
    () => buildActivateHandler(rows, hasPermission, router),
    [rows, hasPermission, router]
  );

  const handleVerify = useCallback(
    () => buildVerifyHandler(rows, router, notifications, labels.errorNoStudentId),
    [rows, router, notifications, labels]
  );

  const handleNewReport = useCallback(() => {
    router.push("/classes/new");
  }, [router]);

  const handleOpenAuditLogs = useCallback(() => {
    notifications.show(labels.errorAuditLogsComingSoon, { severity: "info", autoHideDuration: 4000 });
  }, [notifications, labels]);

  const cardListLabels = useMemo(() => buildCardListLabels(labels), [labels]);
  const analyticsLabels = useMemo(() => buildAnalyticsLabels(labels), [labels]);

  return {
    metrics,
    rows,
    totalSessions: rows.length,
    suspendedCount,
    labels,
    dateValue: selectedDate,
    onDateChange: setSelectedDate,
    onActivate: onActivate ?? handleActivate,
    onReschedule: onReschedule ?? handleReschedule,
    onVerify: onVerify ?? handleVerify,
    onNewReport: onNewReport ?? handleNewReport,
    onOpenAuditLogs: onOpenAuditLogs ?? handleOpenAuditLogs,
    cardListLabels,
    analyticsLabels,
  };
}
