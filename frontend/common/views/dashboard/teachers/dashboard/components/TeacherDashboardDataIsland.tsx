"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useState } from "react";
import { teacherDashboardQueryDocument } from "@/frontend/common/graphql/sharedDocuments/teachers/teacher-dashboard.documents";
import { useTeacherDashboardStore } from "@/frontend/common/stores/teacherDashboardStore";
import type { MissedClassAlert, TeacherScheduleRow } from "@/frontend/common/types/shared.types";
import type {
  TeacherDashboardLastUpdatedLabels,
  TeacherDashboardViewLabels,
} from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
import { buildStudentProgressFeedItems } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildStudentProgressFeedItems";
import { buildTeacherActiveMetricItems } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/buildTeacherDashboardMetrics";
import { useTeacherDashboardLastUpdated } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/useTeacherDashboardLastUpdated";

interface RawRow {
  readonly id?: string | null;
  readonly studentId?: string | null;
  readonly studentName?: string | null;
  readonly scheduledStartAt?: string | Date | null;
  readonly durationMinutes?: number | null;
  readonly executionState?: string | null;
  readonly outcome?: string | null;
  readonly zoomMeetingUrl?: string | null;
  readonly yourTimeFormatted?: string | null;
}

interface DataIslandProps {
  /** Current label bag, built once per locale change by the coordinator. */
  readonly labels: TeacherDashboardViewLabels;
  readonly lastUpdatedLabels: TeacherDashboardLastUpdatedLabels;
}

/**
 * Owns the dashboard query, derives `metricItems`, `scheduleRows`,
 * `progressFeed`, `missedAlert`, `totalCount`, `dashboardId`, `teacherId`,
 * `lastUpdated`, and the `loading` flag from `useQuery`. All of these are
 * pushed into the store data slice so the coordinator reads them when
 * composing the ViewModel — mutation islands can request a refetch through
 * the registered `refetch` handler.
 */
export function TeacherDashboardDataIsland({ labels, lastUpdatedLabels }: Readonly<DataIslandProps>) {
  const filterDate = useTeacherDashboardStore(state => state.filterDate);
  const page = useTeacherDashboardStore(state => state.page);
  const pageSize = useTeacherDashboardStore(state => state.pageSize);
  const setData = useTeacherDashboardStore(state => state.setData);
  const setHandlers = useTeacherDashboardStore(state => state.setHandlers);

  const paginationArgs = {
    first: pageSize,
    page: page + 1,
    after: null,
    before: null,
    last: null,
    maxCount: null,
    skip: null,
  };

  const {
    data: dashboardData,
    loading,
    refetch,
  } = useQuery(teacherDashboardQueryDocument, {
    variables: { date: filterDate, pagination: paginationArgs },
    fetchPolicy: "cache-and-network",
  });

  const [dataArrivedAt, setDataArrivedAt] = useState<number | null>(null);
  useEffect(() => {
    if (dashboardData?.teacherDashboard) {
      setDataArrivedAt(Date.now());
    }
  }, [dashboardData]);

  const lastUpdated = useTeacherDashboardLastUpdated(dataArrivedAt, lastUpdatedLabels);

  const refetchHandler = useCallback(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    setHandlers({ refetch: refetchHandler });
  }, [refetchHandler, setHandlers]);

  useEffect(() => {
    const dashboardId = dashboardData?.teacherDashboard?.id || "";
    const teacherId = dashboardId.split("-")[2] || "";
    const scheduleRows = mapRows(dashboardData?.teacherDashboard?.scheduleRows, filterDate);
    const totalCount = dashboardData?.teacherDashboard?.totalCount ?? 0;
    const dashboardMetrics = dashboardData?.teacherDashboard?.metrics;
    const metricItems = buildTeacherActiveMetricItems(dashboardMetrics, labels.activeMetrics);
    const progressFeed = buildStudentProgressFeedItems(
      dashboardData?.teacherDashboard?.progressFeed,
      labels.progressFeed,
      labels.schedule.durationValue,
      value => {
        const elapsedMin = Math.floor((Date.now() - value.getTime()) / 60_000);
        if (elapsedMin < 1) {
          return lastUpdatedLabels.updatedJustNow;
        }
        return lastUpdatedLabels.updatedMinutesAgo(elapsedMin);
      }
    );
    const missedRow = scheduleRows.find(r => r.status === "missed");
    const missedAlert: MissedClassAlert | null = missedRow
      ? { classId: missedRow.classId, scheduledTime: missedRow.timeRange }
      : null;

    setData({
      loading: dashboardData === undefined && loading,
      metricItems,
      scheduleRows,
      progressFeed,
      missedAlert,
      totalCount,
      dashboardId,
      teacherId,
      lastUpdated,
    });
  }, [dashboardData, loading, filterDate, labels, lastUpdated, lastUpdatedLabels, setData]);

  return null;
}

function mapRows(rows: readonly RawRow[] | null | undefined, todayDateStr: string): TeacherScheduleRow[] {
  if (!rows) return [];
  return rows.map((row, idx) => {
    const startAt = new Date(row.scheduledStartAt || todayDateStr);
    const endAt = new Date(startAt.getTime() + (row.durationMinutes || 60) * 60000);
    const startWindow = new Date(startAt.getTime() - 5 * 60000);
    const now = new Date();
    let status: "upcoming" | "completed" | "missed" | "activated" | "active" = "upcoming";
    if (row.outcome === "TAKEN" || row.outcome === "COMPLETED") {
      status = "completed";
    } else if (
      row.outcome === "ABSENT" ||
      row.outcome === "LEAVE" ||
      row.outcome === "CANCELLED" ||
      row.outcome === "MISSED"
    ) {
      status = "missed";
    } else if (row.executionState === "ACTIVATED") {
      status = "activated";
    } else if (row.executionState === "IN_PROGRESS") {
      status = "active";
    }

    const activateEnabled = now >= startWindow && now <= endAt && row.executionState === "NOT_ACTIVATED";

    return {
      id: row.id || `row-${idx}`,
      rowNumber: idx + 1,
      classId: row.id || "",
      studentId: row.studentId || "",
      studentName: row.studentName || "Unknown",
      studentInitials: row.studentName
        ? row.studentName
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "ST",
      timeRange: row.yourTimeFormatted || startAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status,
      videoEnabled: Boolean(row.zoomMeetingUrl),
      activateEnabled,
      durationMinutes: row.durationMinutes ?? undefined,
      meetingJoinUrl: row.zoomMeetingUrl ?? null,
      isLive: row.executionState === "ACTIVATED" || row.executionState === "IN_PROGRESS",
      isCurrent: row.executionState === "ACTIVATED" || row.executionState === "IN_PROGRESS",
    };
  });
}
