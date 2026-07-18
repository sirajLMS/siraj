"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { formatMonthYear } from "@/frontend/common/components/intl/dateFormat";
import { studentClassHistoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-history.documents";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { safeOpenWindow } from "@/frontend/common/lib/safeOpenWindow";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useStudentPortalHistoryStore } from "@/frontend/common/stores/studentPortalHistoryStore";
import type { StudentHistoryLabels } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryLabels";
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
import { useRouter } from "@/shared/i18n/routing";
import { type StudentPortalHistoryLabels, useAppTranslation } from "@/shared/locale";

function useStudentHistoryLabels(t: StudentPortalHistoryLabels): StudentHistoryLabels {
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

export function useStudentHistoryViewModel(_props: UseStudentHistoryViewModelProps): StudentHistoryViewModel {
  const t = useAppTranslation().dashboardTranslations.studentPortalHistory;
  const router = useRouter();
  const locale = useAppLocale();
  const labels = useStudentHistoryLabels(t);

  const year = useStudentPortalHistoryStore(s => s.year);
  const month = useStudentPortalHistoryStore(s => s.month);
  const selectedDay = useStudentPortalHistoryStore(s => s.selectedDay);
  const selectedWeek = useStudentPortalHistoryStore(s => s.selectedWeek);
  const subjectFilter = useStudentPortalHistoryStore(s => s.subjectFilter);
  const statusFilter = useStudentPortalHistoryStore(s => s.statusFilter);
  const goPrevMonth = useStudentPortalHistoryStore(s => s.goPrevMonth);
  const goNextMonth = useStudentPortalHistoryStore(s => s.goNextMonth);
  const setSelectedDay = useStudentPortalHistoryStore(s => s.setSelectedDay);
  const setSelectedWeek = useStudentPortalHistoryStore(s => s.setSelectedWeek);
  const setSubjectFilter = useStudentPortalHistoryStore(s => s.setSubjectFilter);
  const setStatusFilter = useStudentPortalHistoryStore(s => s.setStatusFilter);

  const currentMonth = useMemo(() => new Date(year, month - 1, 1), [year, month]);
  const monthLabel = formatMonthYear(currentMonth, locale);

  const now = new Date();
  const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);

  const { data: profileData, loading: profileLoading } = useQuery(studentProfileQueryDocument, {
    variables: { studentId: null, year: null, month: null },
    fetchPolicy: "cache-and-network",
  });

  const studentId = profileData?.studentProfile?.id ?? null;

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

  const filteredSessions = useMemo(
    () => filterHistorySessions(sessions, subjectFilter, statusFilter),
    [sessions, subjectFilter, statusFilter]
  );

  const sessionsByDay = useMemo(() => mapSessionsByDay(sessions), [sessions]);
  const subjectOptions = useMemo(() => uniqueSessionSubjects(sessions), [sessions]);
  const statusOptions = useMemo(() => uniqueSessionStatuses(sessions), [sessions]);

  const loading = profileLoading || historyLoading;

  return {
    metrics,
    sessions,
    filteredSessions,
    sessionsByDay,
    subjectOptions,
    statusOptions,
    subjectFilter,
    statusFilter,
    year,
    month,
    currentMonth,
    monthLabel,
    selectedDay,
    selectedWeek,
    canGoNext,
    labels,
    locale,
    loading,
    onBackToDashboard: () => router.push("/students/me"),
    onOpenMeetingUrl: (url: string | null | undefined) => safeOpenWindow(url),
    onPrevMonth: goPrevMonth,
    onNextMonth: goNextMonth,
    onSelectDay: setSelectedDay,
    onSelectWeek: setSelectedWeek,
    onSubjectFilterChange: setSubjectFilter,
    onStatusFilterChange: setStatusFilter,
  };
}
