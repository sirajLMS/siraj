"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo } from "react";
import { studentClassHistoryQueryDocument } from "@/frontend/graphql/sharedDocuments/students/student-history.documents";
import { useStudentHistoryStore } from "@/frontend/stores/studentHistoryStore";
import { logger } from "@/frontend/utils/logger";
import { StudentHistoryView } from "@/frontend/views/dashboard/students/history/StudentHistoryView";
import type { ClassSession, StudentHistoryMetrics } from "@/frontend/views/dashboard/students/history/types";
import { mapStatusToAttendance } from "@/frontend/views/dashboard/students/history/types";
import { useStudentProfileContext } from "@/frontend/views/dashboard/students/profile/StudentProfileContext";

export function StudentHistoryContainer() {
  const params = useParams<{ id: string }>();
  const profileContext = useStudentProfileContext();
  const useUnifiedProfile = profileContext != null;
  const t = useTranslations("dashboard.studentHistory");
  const notifications = useNotifications();

  const { currentMonth, selectedWeek, selectedDay, setCurrentMonth, setSelectedWeek, setSelectedDay } =
    useStudentHistoryStore();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  const { data, loading, error } = useQuery(studentClassHistoryQueryDocument, {
    variables: { studentId: params.id, year, month },
    skip: !params.id || useUnifiedProfile,
  });

  useEffect(() => {
    if (!useUnifiedProfile && error) {
      logger.error("Error loading student history:", { error });
      notifications.show(t("errors.loadFailed"), {
        severity: "error",
        autoHideDuration: 4000,
      });
    }
  }, [useUnifiedProfile, error, notifications, t]);

  const historyData = useUnifiedProfile ? profileContext?.profile?.classHistory : data?.studentClassHistory;
  const studentName = historyData?.studentName ?? t("common.student");

  const metrics: StudentHistoryMetrics = useMemo(
    () => ({
      totalClasses: historyData?.metrics?.totalClasses ?? 0,
      attendanceRate: historyData?.metrics?.attendanceRate ?? 0,
      hoursStudied: historyData?.metrics?.hoursStudied ?? 0,
      performance: historyData?.metrics?.performance ?? 0,
    }),
    [historyData]
  );

  const classes: Record<number, ClassSession> = useMemo(() => {
    const result: Record<number, ClassSession> = {};
    if (historyData?.sessions) {
      for (const session of historyData.sessions) {
        if (session?.dayOfMonth !== null && session.dayOfMonth !== undefined) {
          result[session.dayOfMonth] = {
            id: session.id ?? "",
            dayOfMonth: session.dayOfMonth,
            title: session.title ?? t("classDetails.classSession"),
            time: session.time ?? "",
            duration: session.duration ?? 0,
            status: mapStatusToAttendance(session.status ?? "present"),
            executionState: session.status ?? "",
            outcome: session.outcome ?? null,
            instructor: session.instructor ?? "",
            timeSlot: session.timeSlot ?? "",
            room: session.room ?? "",
            notes: session.notes ?? "",
            meetingJoinUrl: session.meetingJoinUrl,
            effectiveMeeting: session.effectiveMeeting,
          };
        }
      }
    }
    return result;
  }, [historyData, t]);

  const handlePrevMonth = useCallback(() => {
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(prev);
  }, [currentMonth, setCurrentMonth]);

  const handleNextMonth = useCallback(() => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(next);
  }, [currentMonth, setCurrentMonth]);

  const handlePrint = useCallback(() => {
    globalThis.print();
  }, []);

  const handleSelectDay = useCallback(
    (day: number | null) => {
      setSelectedDay(day);
    },
    [setSelectedDay]
  );

  if ((useUnifiedProfile ? profileContext?.loading : loading) && !historyData) {
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
