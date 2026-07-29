"use client";

import { useCallback, useMemo } from "react";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import {
  useStudentPortalClassHistory,
  useStudentPortalDerivedSessionData,
  useStudentPortalHistoryDates,
  useStudentPortalHistoryFilters,
  useStudentPortalHistoryNavigation,
  useStudentPortalProfile,
} from "@/frontend/common/views/dashboard/student/history/hooks/useStudentPortalHistoryData";
import type {
  StudentHistoryMetrics,
  StudentHistorySessionRow,
} from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import { collectDaysWithSessions } from "@/frontend/common/views/dashboard/student/history/utils/studentHistoryFilters";
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
      scheduleFor: t.scheduleFor,
    }),
    [t]
  );
}

function resolveEffectiveSelectedDay(selectedDay: number | null, currentMonth: Date): number {
  if (selectedDay != null) {
    return selectedDay;
  }

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === currentMonth.getFullYear() && now.getMonth() === currentMonth.getMonth();

  if (isCurrentMonth) {
    return now.getDate();
  }

  return 1;
}

export interface StudentHistoryViewModel {
  readonly metrics: StudentHistoryMetrics;
  readonly sessionsByDay: Readonly<Partial<Record<number, StudentHistorySessionRow>>>;
  readonly monthSessions: readonly StudentHistorySessionRow[];
  readonly daysWithSessions: ReadonlySet<number>;
  readonly currentMonth: Date;
  readonly monthLabel: string;
  readonly selectedDay: number | null;
  readonly effectiveSelectedDay: number;
  readonly sessionsForSelectedDay: readonly StudentHistorySessionRow[];
  readonly canGoNext: boolean;
  readonly labels: StudentHistoryLabels;
  readonly locale: string;
  readonly loading: boolean;
  readonly onPrevMonth: () => void;
  readonly onNextMonth: () => void;
  readonly onSelectDay: (day: number | null) => void;
  readonly onTabChange: (dayId: string) => void;
  readonly onOpenMeetingUrl: (url: string | null | undefined) => void;
}

export type UseStudentHistoryViewModelProps = Record<string, never>;

export function useStudentHistoryViewModel(_props: UseStudentHistoryViewModelProps): StudentHistoryViewModel {
  const t = useAppTranslation(Translation.Dashboard.StudentPortalHistory);
  const locale = useAppLocale();
  const labels = useStudentHistoryLabels(t);

  const dates = useStudentPortalHistoryDates(locale);
  const filters = useStudentPortalHistoryFilters();
  const { setSelectedDay } = filters;
  const navigation = useStudentPortalHistoryNavigation();
  const { studentId, profileLoading } = useStudentPortalProfile();
  const { historyLoading, metrics, sessions } = useStudentPortalClassHistory(studentId, dates.year, dates.month);
  const derived = useStudentPortalDerivedSessionData(sessions, "", "");

  const loading = profileLoading || historyLoading;
  const monthSessions = derived.filteredSessions;
  const daysWithSessions = useMemo(() => collectDaysWithSessions(monthSessions), [monthSessions]);

  const effectiveSelectedDay = useMemo(
    () => resolveEffectiveSelectedDay(filters.selectedDay, dates.currentMonth),
    [filters.selectedDay, dates.currentMonth]
  );

  const sessionsForSelectedDay = useMemo(
    () => monthSessions.filter(session => session.dayOfMonth === effectiveSelectedDay),
    [monthSessions, effectiveSelectedDay]
  );

  const onTabChange = useCallback(
    (dayId: string) => {
      const day = Number.parseInt(dayId, 10);
      if (!Number.isNaN(day)) {
        setSelectedDay(day);
      }
    },
    [setSelectedDay]
  );

  return {
    metrics,
    sessionsByDay: derived.sessionsByDay,
    monthSessions,
    daysWithSessions,
    currentMonth: dates.currentMonth,
    monthLabel: dates.monthLabel,
    selectedDay: filters.selectedDay,
    effectiveSelectedDay,
    sessionsForSelectedDay,
    canGoNext: dates.canGoNext,
    labels,
    locale,
    loading,
    onPrevMonth: dates.goPrevMonth,
    onNextMonth: dates.goNextMonth,
    onSelectDay: filters.setSelectedDay,
    onTabChange,
    onOpenMeetingUrl: navigation.onOpenMeetingUrl,
  };
}
