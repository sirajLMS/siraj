"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useMemo } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { statusTrackingScheduleQueryDocument } from "@/frontend/graphql/sharedDocuments/schedule.documents";
import { useRescheduleStore } from "@/frontend/stores/rescheduleStore";
import { logger } from "@/frontend/utils/logger";
import { StatusTrackingView } from "@/frontend/views/dashboard/classes/status/tracking/StatusTrackingView";
import type { StatusTrackingRow } from "@/frontend/views/dashboard/classes/status/tracking/types";
import { useStatusTrackingLabels } from "@/frontend/views/dashboard/classes/status/tracking/useStatusTrackingLabels";
import { useStatusTrackingMetrics } from "@/frontend/views/dashboard/classes/status/tracking/useStatusTrackingMetrics";
import { useRouter } from "@/shared/i18n/routing";

export function StatusTrackingContainer() {
  const router = useRouter();
  const setRescheduleSession = useRescheduleStore(state => state.setSession);
  const labels = useStatusTrackingLabels();
  const notifications = useNotifications();

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const { data, loading, error } = useQuery(statusTrackingScheduleQueryDocument, {
    variables: { date: today, search: null, viewerTimezone: null },
    fetchPolicy: "cache-and-network",
  });

  const rows: readonly StatusTrackingRow[] = useMemo(
    () => data?.statusTrackingSchedule ?? [],
    [data?.statusTrackingSchedule]
  );

  const { metrics, suspendedCount } = useStatusTrackingMetrics(rows);

  const handleReschedule = (id: string) => {
    const row = rows.find(session => session.id === id);
    if (row) {
      setRescheduleSession({
        sessionId: id,
        teacherName: row.teacherName ?? "",
        studentName: row.studentName ?? "",
        teacherTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
    router.push("/reschedule");
  };

  const handleActivate = (id: string) => {
    router.push(`/classes/${id}`);
  };

  const handleJoin = (id: string) => {
    router.push(`/classes/${id}`);
  };

  const handleVerify = (id: string) => {
    const row = rows.find(session => session.id === id);
    const studentId = row?.studentId;
    if (studentId) {
      router.push(`/students/${studentId}/status`);
    } else {
      notifications.show(labels.errorNoStudentId, { severity: "warning", autoHideDuration: 4000 });
    }
  };

  const handleNewReport = () => {
    router.push("/classes/new");
  };

  const handleOpenAuditLogs = () => {
    notifications.show(labels.errorAuditLogsComingSoon, { severity: "info", autoHideDuration: 4000 });
  };

  const handleSeeAll = () => {
    router.push("/schedule");
  };

  if (loading && !data) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    logger.error("Error fetching status tracking data:", error);
    return <Box sx={{ p: 3, textAlign: "center" }}>{labels.errorFailedToLoad}</Box>;
  }

  return (
    <RequirePermission permissions={[AppPermission.ScheduleViewAll, AppPermission.DashboardViewMetrics]}>
      <StatusTrackingView
        metrics={metrics}
        rows={rows}
        totalSessions={rows.length}
        suspendedCount={suspendedCount}
        labels={labels}
        onActivate={handleActivate}
        onReschedule={handleReschedule}
        onVerify={handleVerify}
        onNewReport={handleNewReport}
        onJoin={handleJoin}
        onOpenAuditLogs={handleOpenAuditLogs}
        onSeeAll={handleSeeAll}
      />
    </RequirePermission>
  );
}
