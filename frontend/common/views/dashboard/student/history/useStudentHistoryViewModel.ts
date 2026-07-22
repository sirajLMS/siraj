"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { formatMonthYear } from "@/frontend/common/components/intl/dateFormat";
import { studentClassHistoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-history.documents";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { safeOpenWindow } from "@/frontend/common/lib/safeOpenWindow";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useStudentPortalHistoryStore } from "@/frontend/common/stores/studentPortalHistoryStore";
import type {
  StudentHistoryMetrics,
  StudentHistorySessionRow,
} from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import {
  filterHistorySessions,
  mapSessionsByDay,
  uniqueSessionStatuses,
  uniqueSessionSubjects,
} from "@/frontend/common/views/dashboard/student/history/utils/studentHistoryFilters";
import {
  mapStudentHistoryMetrics,
  mapStudentHistorySessions,
} from "@/frontend/common/views/dashboard/student/history/utils/studentHistoryMappers";
import { useRouter } from "@/shared/i18n/navigation";
import { type StudentPortalHistoryLabels as StudentHistoryLabels, useAppTranslation } from "@/shared/locale";

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
    }),
    [t]
  );
}

export interface StudentHistoryViewModel {
  readonly metrics: StudentHistoryMetrics;
  readonly sessions: readonly StudentHistorySessionRow[];
  readonly filteredSessions: readonly StudentHistorySessionRow[];
  readonly sessionsByDay: Readonly<Partial<Record<number, StudentHistorySessionRow>>>;
  readonly subjectOptions: readonly string[];
  readonly statusOptions: readonly string[];
  readonly subjectFilter: string;
  readonly statusFilter: string;
  readonly year: number;
  readonly month: number;
  readonly currentMonth: Date;
  readonly monthLabel: string;
  readonly selectedDay: number | null;
  readonly selectedWeek: number;
  readonly canGoNext: boolean;
  readonly labels: StudentHistoryLabels;
  readonly locale: string;
  readonly loading: boolean;
  readonly onBackToDashboard: () => void;
  readonly onOpenMeetingUrl: (url: string | null | undefined) => void;
  readonly onPrevMonth: () => void;
  readonly onNextMonth: () => void;
  readonly onSelectDay: (day: number | null) => void;
  readonly onSelectWeek: (week: number) => void;
  readonly onSubjectFilterChange: (subject: string) => void;
  readonly onStatusFilterChange: (status: string) => void;
}

export type UseStudentHistoryViewModelProps = Record<string, never>;

interface StudentHistoryNavigation {
  readonly onBackToDashboard: () => void;
  readonly onOpenMeetingUrl: (url: string | null | undefined) => void;
}

function useStudentHistoryNavigation(): StudentHistoryNavigation {
  const router = useRouter();
  return useMemo(
    () => ({
      onBackToDashboard: () => router.push("/students/me"),
      onOpenMeetingUrl: (url: string | null | undefined) => safeOpenWindow(url),
    }),
    [router]
  );
}

function useStudentHistoryDates(locale: string) {
  const year = useStudentPortalHistoryStore(s => s.year);
  const month = useStudentPortalHistoryStore(s => s.month);
  const goPrevMonth = useStudentPortalHistoryStore(s => s.goPrevMonth);
  const goNextMonth = useStudentPortalHistoryStore(s => s.goNextMonth);

  const currentMonth = useMemo(() => new Date(year, month - 1, 1), [year, month]);
  const monthLabel = formatMonthYear(currentMonth, locale);

  const now = new Date();
  const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);

  return { year, month, currentMonth, monthLabel, canGoNext, goPrevMonth, goNextMonth };
}

function useStudentHistoryFilters() {
  const selectedDay = useStudentPortalHistoryStore(s => s.selectedDay);
  const selectedWeek = useStudentPortalHistoryStore(s => s.selectedWeek);
  const subjectFilter = useStudentPortalHistoryStore(s => s.subjectFilter);
  const statusFilter = useStudentPortalHistoryStore(s => s.statusFilter);
  const setSelectedDay = useStudentPortalHistoryStore(s => s.setSelectedDay);
  const setSelectedWeek = useStudentPortalHistoryStore(s => s.setSelectedWeek);
  const setSubjectFilter = useStudentPortalHistoryStore(s => s.setSubjectFilter);
  const setStatusFilter = useStudentPortalHistoryStore(s => s.setStatusFilter);

  return {
    selectedDay,
    selectedWeek,
    subjectFilter,
    statusFilter,
    setSelectedDay,
    setSelectedWeek,
    setSubjectFilter,
    setStatusFilter,
  };
}

function useStudentProfile() {
  const { data: profileData, loading: profileLoading } = useQuery(studentProfileQueryDocument, {
    variables: { studentId: null, year: null, month: null },
    fetchPolicy: "cache-and-network",
  });
  return { studentId: profileData?.studentProfile?.id ?? null, profileLoading };
}

function useStudentClassHistory(studentId: string | null, year: number, month: number) {
  const { data: historyData, loading: historyLoading } = useQuery(studentClassHistoryQueryDocument, {
    variables: {
      studentId: studentId ?? "",
      year,
      month,
    },
    skip: !studentId,
    fetchPolicy: "cache-and-network",
  });

  const metrics: StudentHistoryMetrics = useMemo(
    () => mapStudentHistoryMetrics(historyData?.studentClassHistory?.metrics ?? null),
    [historyData]
  );

  const sessions: readonly StudentHistorySessionRow[] = useMemo(
    () => mapStudentHistorySessions(historyData?.studentClassHistory?.sessions ?? null),
    [historyData]
  );

  return { historyLoading, metrics, sessions };
}

function useDerivedSessionData(
  sessions: readonly StudentHistorySessionRow[],
  subjectFilter: string,
  statusFilter: string
) {
  const filteredSessions = useMemo(
    () => filterHistorySessions(sessions, subjectFilter, statusFilter),
    [sessions, subjectFilter, statusFilter]
  );
  const sessionsByDay = useMemo(() => mapSessionsByDay(sessions), [sessions]);
  const subjectOptions = useMemo(() => uniqueSessionSubjects(sessions), [sessions]);
  const statusOptions = useMemo(() => uniqueSessionStatuses(sessions), [sessions]);
  return { filteredSessions, sessionsByDay, subjectOptions, statusOptions };
}

export function useStudentHistoryViewModel(_props: UseStudentHistoryViewModelProps): StudentHistoryViewModel {
  const t = useAppTranslation().dashboardTranslations.studentPortalHistory;
  const locale = useAppLocale();
  const labels = useStudentHistoryLabels(t);

  const dates = useStudentHistoryDates(locale);
  const filters = useStudentHistoryFilters();
  const navigation = useStudentHistoryNavigation();
  const { studentId, profileLoading } = useStudentProfile();
  const { historyLoading, metrics, sessions } = useStudentClassHistory(studentId, dates.year, dates.month);
  const derived = useDerivedSessionData(sessions, filters.subjectFilter, filters.statusFilter);

  const loading = profileLoading || historyLoading;

  return {
    metrics,
    sessions,
    filteredSessions: derived.filteredSessions,
    sessionsByDay: derived.sessionsByDay,
    subjectOptions: derived.subjectOptions,
    statusOptions: derived.statusOptions,
    subjectFilter: filters.subjectFilter,
    statusFilter: filters.statusFilter,
    year: dates.year,
    month: dates.month,
    currentMonth: dates.currentMonth,
    monthLabel: dates.monthLabel,
    selectedDay: filters.selectedDay,
    selectedWeek: filters.selectedWeek,
    canGoNext: dates.canGoNext,
    labels,
    locale,
    loading,
    onBackToDashboard: navigation.onBackToDashboard,
    onOpenMeetingUrl: navigation.onOpenMeetingUrl,
    onPrevMonth: dates.goPrevMonth,
    onNextMonth: dates.goNextMonth,
    onSelectDay: filters.setSelectedDay,
    onSelectWeek: filters.setSelectedWeek,
    onSubjectFilterChange: filters.setSubjectFilter,
    onStatusFilterChange: filters.setStatusFilter,
  };
}
