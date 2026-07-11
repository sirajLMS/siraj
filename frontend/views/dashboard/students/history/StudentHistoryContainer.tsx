"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo } from "react";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";
import { studentClassHistoryQueryDocument } from "@/frontend/graphql/sharedDocuments/students/student-history.documents";
import { useStudentHistoryStore } from "@/frontend/stores/studentHistoryStore";
import { logger } from "@/frontend/utils/logger";
import { StudentHistoryView } from "@/frontend/views/dashboard/students/history/StudentHistoryView";
import type { ClassSession, StudentHistoryMetrics } from "@/frontend/views/dashboard/students/history/types";
import { mapStatusToAttendance } from "@/frontend/views/dashboard/students/history/types";
import { useStudentProfileContext } from "@/frontend/views/dashboard/students/profile/StudentProfileContext";

type HistoryData = NonNullable<NonNullable<Operations.StudentClassHistoryQuery["studentClassHistory"]>>;

function useErrorNotification(
  error: unknown,
  notifications: ReturnType<typeof useNotifications>,
  t: ReturnType<typeof useTranslations>
) {
  useEffect(() => {
    if (error) {
      logger.error("Error loading student history:", { error });
      notifications.show(t("errors.loadFailed"), {
        severity: "error" as const,
        autoHideDuration: 4000,
      });
    }
  }, [error, notifications, t]);
}

function computeMetrics(historyData: HistoryData["metrics"] | undefined): StudentHistoryMetrics {
  return {
    totalClasses: historyData?.totalClasses ?? 0,
    attendanceRate: historyData?.attendanceRate ?? 0,
    hoursStudied: historyData?.hoursStudied ?? 0,
    performance: historyData?.performance ?? 0,
  };
}

function mapSessionsToClasses(
  sessions: HistoryData["sessions"] | undefined,
  t: ReturnType<typeof useTranslations>
): Record<number, ClassSession> {
  const result: Record<number, ClassSession> = {};
  if (sessions) {
    for (const session of sessions) {
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
          isFrozen: session.isFrozen ?? false,
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
}

function computeEnrollmentMonth(createdAt: string | null | undefined): Date | undefined {
  if (!createdAt) return undefined;
  const d = new Date(createdAt);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function useMonthNavigation(
  currentMonth: Date,
  nowMonth: Date,
  enrollmentMonth: Date | undefined,
  setCurrentMonth: (d: Date) => void
) {
  const handlePrevMonth = useCallback(() => {
    if (enrollmentMonth && currentMonth <= enrollmentMonth) return;
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }, [currentMonth, setCurrentMonth, enrollmentMonth]);

  const handleNextMonth = useCallback(() => {
    if (currentMonth >= nowMonth) return;
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }, [currentMonth, setCurrentMonth, nowMonth]);

  return { handlePrevMonth, handleNextMonth };
}

export function StudentHistoryContainer() {
  const params = useParams<{ id: string }>();
  const profileContext = useStudentProfileContext();
  const useUnifiedProfile = profileContext != null;
  const t = useTranslations("dashboard.studentHistory");
  const notifications = useNotifications();
  const locale = useLocale();

  const { currentMonth, selectedWeek, selectedDay, setCurrentMonth, setSelectedWeek, setSelectedDay } =
    useStudentHistoryStore();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;
  const studentId = useUnifiedProfile ? (profileContext?.studentId ?? "") : (params?.id ?? "");

  const nowMonth = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);

  const { data, loading, error } = useQuery(studentClassHistoryQueryDocument, {
    variables: { studentId, year, month },
    skip: !studentId,
  });

  useErrorNotification(error, notifications, t);

  const historyData = data?.studentClassHistory;
  const studentName = historyData?.studentName ?? t("common.student");

  const metrics = useMemo(() => computeMetrics(historyData?.metrics), [historyData]);
  const classes = useMemo(() => mapSessionsToClasses(historyData?.sessions, t), [historyData, t]);

  const enrollmentMonth = useMemo(
    () => (useUnifiedProfile ? computeEnrollmentMonth(profileContext?.profile?.createdAt) : undefined),
    [useUnifiedProfile, profileContext?.profile?.createdAt]
  );

  const { handlePrevMonth, handleNextMonth } = useMonthNavigation(
    currentMonth,
    nowMonth,
    enrollmentMonth,
    setCurrentMonth
  );

  const handlePrint = useCallback(() => {
    globalThis.print();
  }, []);

  const handleSelectDay = useCallback(
    (day: number | null) => {
      setSelectedDay(day);
    },
    [setSelectedDay]
  );

  if (loading && !historyData) {
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
      embedded={useUnifiedProfile}
      onSelectWeek={setSelectedWeek}
      onSelectDay={handleSelectDay}
      onPrevMonth={handlePrevMonth}
      onNextMonth={handleNextMonth}
      onPrint={handlePrint}
      enrollmentMonth={enrollmentMonth}
      nowMonth={nowMonth}
      locale={locale}
    />
  );
}
