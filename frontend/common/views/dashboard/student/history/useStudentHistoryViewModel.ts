"use client";

import { useMemo } from "react";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import {
  useStudentPortalClassHistory,
  useStudentPortalDerivedSessionData,
  useStudentPortalHistoryDates,
  useStudentPortalHistoryFilters,
  useStudentPortalProfile,
} from "@/frontend/common/views/dashboard/student/history/hooks/useStudentPortalHistoryData";
import type {
  StudentHistoryMetrics,
} from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import {
  type StudentPortalHistoryLabels as StudentHistoryLabels,
  Translation,
  useAppTranslation,
} from "@/shared/locale";

function useStudentHistoryLabels(t: StudentHistoryLabels): StudentHistoryLabels {
  return useMemo(
    () => ({
      pageTitle: t.pageTitle,
      lessonHistory: t.lessonHistory,
      sessionDate: t.sessionDate,
      subject: t.subject,
      instructor: t.instructor,
      duration: t.duration,
      status: t.status,
      outcome: t.outcome,
      notes: t.notes,
      joinUrl: t.joinUrl,
      noHistory: t.noHistory,
      loadingMessage: t.loadingMessage,
      filterBySubject: t.filterBySubject,
      filterByDate: t.filterByDate,
      filterByStatus: t.filterByStatus,
      allSubjects: t.allSubjects,
      allStatuses: t.allStatuses,
      viewReport: t.viewReport,
      addReflection: t.addReflection,
      previousMonth: t.previousMonth,
      nextMonth: t.nextMonth,
      totalClasses: t.totalClasses,
      attendanceRate: t.attendanceRate,
      hoursStudied: t.hoursStudied,
      performance: t.performance,
      backToDashboard: t.backToDashboard,
      weeklyAttendance: t.weeklyAttendance,
      week: t.week,
      statusLabels: t.statusLabels,
      minutesShort: t.minutesShort,
      viewClass: t.viewClass,
      joinSession: t.joinSession,
      sessionsList: t.sessionsList,
      calendarWeekdays: t.calendarWeekdays,
    }),
    [t]
  );
}

export interface StudentHistoryViewModel {
  readonly metrics: StudentHistoryMetrics;
  readonly sessionsByDay: Readonly<Partial<Record<number, StudentHistorySessionRow>>>;
  readonly currentMonth: Date;
  readonly monthLabel: string;
  readonly selectedDay: number | null;
  readonly selectedWeek: number;
  readonly canGoNext: boolean;
  readonly labels: StudentHistoryLabels;
  readonly locale: string;
  readonly loading: boolean;
  readonly onPrevMonth: () => void;
  readonly onNextMonth: () => void;
  readonly onSelectDay: (day: number | null) => void;
  readonly onSelectWeek: (week: number) => void;
}

export type UseStudentHistoryViewModelProps = Record<string, never>;

export function useStudentHistoryViewModel(_props: UseStudentHistoryViewModelProps): StudentHistoryViewModel {
  const t = useAppTranslation(Translation.Dashboard.StudentPortalHistory);
  const locale = useAppLocale();
  const labels = useStudentHistoryLabels(t);

  const dates = useStudentPortalHistoryDates(locale);
  const filters = useStudentPortalHistoryFilters();
  const { studentId, profileLoading } = useStudentPortalProfile();
  const { historyLoading, metrics, sessions } = useStudentPortalClassHistory(studentId, dates.year, dates.month);
  const derived = useStudentPortalDerivedSessionData(sessions, "", "");

  const loading = profileLoading || historyLoading;

  return {
    metrics,
    sessionsByDay: derived.sessionsByDay,
    currentMonth: dates.currentMonth,
    monthLabel: dates.monthLabel,
    selectedDay: filters.selectedDay,
    selectedWeek: filters.selectedWeek,
    canGoNext: dates.canGoNext,
    labels,
    locale,
    loading,
    onPrevMonth: dates.goPrevMonth,
    onNextMonth: dates.goNextMonth,
    onSelectDay: filters.setSelectedDay,
    onSelectWeek: filters.setSelectedWeek,
  };
}
