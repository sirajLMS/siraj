"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress } from "@mui/material";
import { useParams } from "next/navigation";
import { useState } from "react";
import { studentClassHistoryQueryDocument } from "@/frontend/graphql/sharedDocuments/student-history.documents";
import { StudentHistoryView } from "./StudentHistoryView";
import type { ClassSession, StudentHistoryMetrics } from "./types";

export function StudentHistoryContainer() {
  const params = useParams<{ id: string }>();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 5, 18)); // default to current date/month context
  const [selectedWeek, setSelectedWeek] = useState<number>(3);

  // Sync year and month with currentMonth state
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1; // 1-indexed for backend query

  const { data, loading, error } = useQuery(studentClassHistoryQueryDocument, {
    variables: { studentId: params.id, year, month },
    skip: !params.id,
  });

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

  return (
    <StudentHistoryView
      studentName={studentName}
      currentMonth={currentMonth}
      metrics={metrics}
      classes={classes}
      selectedWeek={selectedWeek}
      onSelectWeek={setSelectedWeek}
      onMonthChange={setCurrentMonth}
    />
  );
}
