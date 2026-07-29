"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { formatMonthYear } from "@/frontend/common/components/intl/dateFormat";
import { studentClassHistoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-history.documents";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { safeOpenWindow } from "@/frontend/common/lib/safeOpenWindow";
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

export function useStudentPortalHistoryDates(locale: string) {
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

export function useStudentPortalHistoryFilters() {
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

export function useStudentPortalHistoryNavigation() {
  return useMemo(
    () => ({
      onOpenMeetingUrl: (url: string | null | undefined) => safeOpenWindow(url),
    }),
    []
  );
}

export function useStudentPortalProfile() {
  const { data: profileData, loading: profileLoading } = useQuery(studentProfileQueryDocument, {
    variables: { studentId: null, year: null, month: null, includeUpcomingClasses: true },
    fetchPolicy: "cache-and-network",
  });
  return { studentId: profileData?.studentProfile?.id ?? null, profileLoading };
}

export function useStudentPortalClassHistory(studentId: string | null, year: number, month: number) {
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
    () => mapStudentHistorySessions(historyData?.studentClassHistory?.sessions ?? null, year, month),
    [historyData, year, month]
  );

  return { historyLoading, metrics, sessions };
}

export function useStudentPortalDerivedSessionData(
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
