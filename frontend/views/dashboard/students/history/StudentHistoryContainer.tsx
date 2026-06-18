"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress } from "@mui/material";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { classStatusEventsQueryDocument } from "@/frontend/graphql/sharedDocuments/class-session.documents";
import { studentClassHistoryQueryDocument } from "@/frontend/graphql/sharedDocuments/student-history.documents";
import { useRouter } from "@/shared/i18n/routing";
import { StudentHistoryView } from "./StudentHistoryView";
import type { ClassSession, StudentHistoryMetrics } from "./types";

export function StudentHistoryContainer() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 5, 18)); // default to current date/month context
  const [selectedWeek, setSelectedWeek] = useState<number>(3);
  const [downloadingSessionId, setDownloadingSessionId] = useState<string | null>(null);

  // Sync year and month with currentMonth state
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1; // 1-indexed for backend query

  const { data, loading, error } = useQuery(studentClassHistoryQueryDocument, {
    variables: { studentId: params.id, year, month },
    skip: !params.id,
  });

  const { data: eventsData } = useQuery(classStatusEventsQueryDocument, {
    variables: { classInstanceId: downloadingSessionId ?? "" },
    skip: !downloadingSessionId,
    fetchPolicy: "network-only",
  });

  // Handle downloading of logs when eventsData changes and is loaded
  useEffect(() => {
    if (eventsData?.classStatusEvents && downloadingSessionId) {
      const blob = new Blob([JSON.stringify(eventsData.classStatusEvents, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `class-${downloadingSessionId}-logs.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDownloadingSessionId(null);
    }
  }, [eventsData, downloadingSessionId]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: "center", color: "error.main" }}>Error loading student history: {error.message}</Box>
    );
  }

  // Map backend query results to frontend structures
  const studentName = data?.studentClassHistory?.studentName ?? "Student";

  const metrics: StudentHistoryMetrics = {
    totalClasses: data?.studentClassHistory?.metrics?.totalClasses ?? 0,
    attendanceRate: data?.studentClassHistory?.metrics?.attendanceRate ?? 0,
    hoursStudied: data?.studentClassHistory?.metrics?.hoursStudied ?? 0,
    performance: data?.studentClassHistory?.metrics?.performance ?? 0,
  };

  const classes: Record<number, ClassSession> = {};
  if (data?.studentClassHistory?.sessions) {
    for (const session of data.studentClassHistory.sessions) {
      if (session?.dayOfMonth !== null && session.dayOfMonth !== undefined) {
        classes[session.dayOfMonth] = {
          id: session.id ?? "",
          dayOfMonth: session.dayOfMonth,
          title: session.title ?? "Class Session",
          time: session.time ?? "",
          duration: session.duration ?? 0,
          status: session.status ?? "present",
          instructor: session.instructor ?? "",
          timeSlot: session.timeSlot ?? "",
          room: session.room ?? "",
          notes: session.notes ?? "",
        };
      }
    }
  }

  const handleViewAssignments = (_classInstanceId: string) => {
    // Navigate to localized resources route
    router.push("/resources");
  };

  const handleDownloadLogs = (classInstanceId: string) => {
    setDownloadingSessionId(classInstanceId);
  };

  return (
    <StudentHistoryView
      studentName={studentName}
      currentMonth={currentMonth}
      metrics={metrics}
      classes={classes}
      selectedWeek={selectedWeek}
      onSelectWeek={setSelectedWeek}
      onMonthChange={setCurrentMonth}
      onViewAssignments={handleViewAssignments}
      onDownloadLogs={handleDownloadLogs}
    />
  );
}
