"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { statusTrackingScheduleQueryDocument } from "@/frontend/graphql/sharedDocuments/schedule.documents";
import { useRescheduleStore } from "@/frontend/stores/rescheduleStore";
import { useRouter } from "@/shared/i18n/routing";
import { StatusTrackingView } from "./StatusTrackingView";
import type { StatusTrackingRow } from "./types";
import { useStatusTrackingLabels } from "./useStatusTrackingLabels";
import { useStatusTrackingMetrics } from "./useStatusTrackingMetrics";

export function StatusTrackingContainer() {
  const router = useRouter();
  const setRescheduleSession = useRescheduleStore(state => state.setSession);
  const labels = useStatusTrackingLabels();

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

  return (
    <StatusTrackingView
      metrics={metrics}
      rows={rows}
      totalSessions={rows.length}
      suspendedCount={suspendedCount}
      labels={labels}
      onActivate={(_id: string) => {}}
      onReschedule={handleReschedule}
      onVerify={(_id: string) => {}}
      onNewReport={() => {}}
    />
  );
}
