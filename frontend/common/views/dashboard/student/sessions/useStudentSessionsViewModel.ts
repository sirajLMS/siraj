"use client";

import { useMemo } from "react";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import {
  useStudentPortalClassHistory,
  useStudentPortalDerivedSessionData,
  useStudentPortalHistoryDates,
  useStudentPortalHistoryFilters,
  useStudentPortalHistoryNavigation,
  useStudentPortalProfile,
} from "@/frontend/common/views/dashboard/student/history/hooks/useStudentPortalHistoryData";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import { type StudentPortalSessionsLabels, Translation, useAppTranslation } from "@/shared/locale";

function useStudentSessionsLabels(t: StudentPortalSessionsLabels): StudentPortalSessionsLabels {
  return useMemo(
    () => ({
      pageTitle: t.pageTitle,
      sessionDate: t.sessionDate,
      subject: t.subject,
      instructor: t.instructor,
      duration: t.duration,
      status: t.status,
      notes: t.notes,
      noHistory: t.noHistory,
      loadingMessage: t.loadingMessage,
      filterBySubject: t.filterBySubject,
      filterByStatus: t.filterByStatus,
      allSubjects: t.allSubjects,
      allStatuses: t.allStatuses,
      previousMonth: t.previousMonth,
      nextMonth: t.nextMonth,
      statusLabels: t.statusLabels,
      minutesShort: t.minutesShort,
      viewClass: t.viewClass,
      joinSession: t.joinSession,
    }),
    [t]
  );
}

export interface StudentSessionsViewModel {
  readonly filteredSessions: readonly StudentHistorySessionRow[];
  readonly subjectOptions: readonly string[];
  readonly statusOptions: readonly string[];
  readonly subjectFilter: string;
  readonly statusFilter: string;
  readonly monthLabel: string;
  readonly selectedDay: number | null;
  readonly canGoNext: boolean;
  readonly labels: StudentPortalSessionsLabels;
  readonly locale: string;
  readonly loading: boolean;
  readonly onOpenMeetingUrl: (url: string | null | undefined) => void;
  readonly onPrevMonth: () => void;
  readonly onNextMonth: () => void;
  readonly onSubjectFilterChange: (subject: string) => void;
  readonly onStatusFilterChange: (status: string) => void;
}

export type UseStudentSessionsViewModelProps = Record<string, never>;

export function useStudentSessionsViewModel(_props: UseStudentSessionsViewModelProps): StudentSessionsViewModel {
  const t = useAppTranslation(Translation.Dashboard.StudentPortalSessions);
  const locale = useAppLocale();
  const labels = useStudentSessionsLabels(t);

  const dates = useStudentPortalHistoryDates(locale);
  const filters = useStudentPortalHistoryFilters();
  const navigation = useStudentPortalHistoryNavigation();
  const { studentId, profileLoading } = useStudentPortalProfile();
  const { historyLoading, sessions } = useStudentPortalClassHistory(studentId, dates.year, dates.month);
  const derived = useStudentPortalDerivedSessionData(sessions, filters.subjectFilter, filters.statusFilter);

  const loading = profileLoading || historyLoading;

  return {
    filteredSessions: derived.filteredSessions,
    subjectOptions: derived.subjectOptions,
    statusOptions: derived.statusOptions,
    subjectFilter: filters.subjectFilter,
    statusFilter: filters.statusFilter,
    monthLabel: dates.monthLabel,
    selectedDay: filters.selectedDay,
    canGoNext: dates.canGoNext,
    labels,
    locale,
    loading,
    onOpenMeetingUrl: navigation.onOpenMeetingUrl,
    onPrevMonth: dates.goPrevMonth,
    onNextMonth: dates.goNextMonth,
    onSubjectFilterChange: filters.setSubjectFilter,
    onStatusFilterChange: filters.setStatusFilter,
  };
}
