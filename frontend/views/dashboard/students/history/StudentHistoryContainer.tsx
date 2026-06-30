"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo } from "react";
import { studentClassHistoryQueryDocument } from "@/frontend/graphql/sharedDocuments/student-history.documents";
import { useStudentHistoryStore } from "@/frontend/stores/studentHistoryStore";
import { logger } from "@/frontend/utils/logger";
import { StudentHistoryView } from "./StudentHistoryView";
import type { ClassSession, StudentHistoryMetrics } from "./types";
import { mapStatusToAttendance } from "./types";

export function StudentHistoryContainer() {
  const params = useParams<{ id: string }>();
  const t = useTranslations("dashboard.studentHistory");
  const notifications = useNotifications();

  const { currentMonth, selectedWeek, selectedDay, setCurrentMonth, setSelectedWeek, setSelectedDay } =
    useStudentHistoryStore();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  const { data, loading, error } = useQuery(studentClassHistoryQueryDocument, {
    variables: { studentId: params.id, year, month },
    skip: !params.id,
  });

  useEffect(() => {
    if (error) {
      logger.error("Error loading student history:", { error });
      notifications.show(t("errors.loadFailed"), {
        severity: "error",
        autoHideDuration: 4000,
      });
    }
  }, [error, notifications, t]);

  const studentName = data?.studentClassHistory?.studentName ?? "Student";

  const metrics: StudentHistoryMetrics = useMemo(
    () => ({
      totalClasses: data?.studentClassHistory?.metrics?.totalClasses ?? 0,
      attendanceRate: data?.studentClassHistory?.metrics?.attendanceRate ?? 0,
      hoursStudied: data?.studentClassHistory?.metrics?.hoursStudied ?? 0,
      performance: data?.studentClassHistory?.metrics?.performance ?? 0,
    }),
    [data]
  );

  const classes: Record<number, ClassSession> = useMemo(() => {
    const result: Record<number, ClassSession> = {};
    if (data?.studentClassHistory?.sessions) {
      for (const session of data.studentClassHistory.sessions) {
        if (session?.dayOfMonth !== null && session.dayOfMonth !== undefined) {
          result[session.dayOfMonth] = {
            id: session.id ?? "",
            dayOfMonth: session.dayOfMonth,
            title: session.title ?? "Class Session",
            time: session.time ?? "",
            duration: session.duration ?? 0,
            status: mapStatusToAttendance(session.status ?? "present"),
            instructor: session.instructor ?? "",
            timeSlot: session.timeSlot ?? "",
            room: session.room ?? "",
            notes: session.notes ?? "",
          };
        }
      }
    }
    return result;
  }, [data]);

  const handlePrevMonth = useCallback(() => {
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(prev);
  }, [currentMonth, setCurrentMonth]);

  const handleNextMonth = useCallback(() => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(next);
  }, [currentMonth, setCurrentMonth]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleSelectDay = useCallback(
    (day: number | null) => {
      setSelectedDay(day);
    },
    [setSelectedDay]
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <StudentHistoryView
      studentName={studentName}
      currentMonth={currentMonth}
      metrics={metrics}
      classes={classes}
      selectedWeek={selectedWeek}
      selectedDay={selectedDay}
      onSelectWeek={setSelectedWeek}
      onSelectDay={handleSelectDay}
      onPrevMonth={handlePrevMonth}
      onNextMonth={handleNextMonth}
      onPrint={handlePrint}
    />
  );
}
