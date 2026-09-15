"use client";

import { useQuery } from "@apollo/client/react";
import { useEffect, useMemo } from "react";
import { studentClassHistoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-history.documents";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import { useStudentHistoryStore } from "@/frontend/common/stores/studentHistoryStore";
import type { ClassSession, StudentHistoryMetrics } from "@/frontend/common/views/dashboard/students/history/types";
import type { StudentHistoryViewProps } from "@/frontend/common/views/dashboard/students/history/types/studentHistoryViewProps";
import {
  mapStudentHistoryClassesByDay,
  mapStudentHistoryMetrics,
} from "@/frontend/common/views/dashboard/students/history/utils/studentHistoryMappers";
import { type StudentHistoryLabels, Translation, useAppLocale, useAppTranslation } from "@/shared/locale";

export interface UseStudentHistoryViewModelProps {
  readonly studentId: string;
}

export interface StudentHistoryViewModel extends StudentHistoryViewProps {
  readonly labels: StudentHistoryLabels;
  readonly loading: boolean;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthBoundsOf(date: Date | undefined): { year: number; month: number } | undefined {
  if (!date) return undefined;
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function useStudentHistoryViewModel(props: Readonly<UseStudentHistoryViewModelProps>): StudentHistoryViewModel {
  const { studentId } = props;
  const t = useAppTranslation(Translation.Dashboard.StudentHistory);
  const locale = useAppLocale();

  const { year, month, selectedWeek, selectedDay, selectWeek, selectDay, prevMonth, nextMonth, resetForStudent } =
    useStudentHistoryStore();
  const setClasses = useStudentHistoryStore(state => state.setClasses);
  const nowMonth = useMemo(() => startOfMonth(new Date()), []);

  useEffect(() => {
    if (!studentId) return;
    resetForStudent(studentId);
  }, [studentId, resetForStudent]);

  const { data: profileData, loading: profileLoading } = useQuery(studentProfileQueryDocument, {
    variables: { studentId, year: null, month: null, includeUpcomingClasses: true },
    fetchPolicy: "cache-and-network",
    skip: !studentId,
  });

  const { data: historyData, loading: historyLoading } = useQuery(studentClassHistoryQueryDocument, {
    variables: { studentId, year, month },
    fetchPolicy: "cache-and-network",
    skip: !studentId,
  });

  const profile = profileData?.studentProfile;

  const metrics: StudentHistoryMetrics = useMemo(
    () => mapStudentHistoryMetrics(historyData?.studentClassHistory?.metrics ?? null),
    [historyData]
  );

  const classes = useMemo<Readonly<Partial<Record<number, ClassSession>>>>(
    () => mapStudentHistoryClassesByDay(historyData?.studentClassHistory?.sessions, year, month),
    [historyData, month, year]
  );

  useEffect(() => {
    setClasses(classes);
  }, [classes, setClasses]);

  const currentMonth = useMemo(() => new Date(year, month - 1, 1), [year, month]);

  const enrollmentMonth = useMemo(
    () => (profile?.createdAt ? startOfMonth(new Date(profile.createdAt)) : undefined),
    [profile]
  );

  const loading = profileLoading || historyLoading;

  return {
    studentName: profile?.name ?? historyData?.studentClassHistory?.studentName ?? "",
    currentMonth,
    metrics,
    classes,
    selectedWeek,
    selectedDay,
    embedded: false,
    onSelectWeek: selectWeek,
    onSelectDay: selectDay,
    onPrevMonth: () => prevMonth(monthBoundsOf(enrollmentMonth)),
    onNextMonth: () => nextMonth(monthBoundsOf(nowMonth)),
    onPrint: () => globalThis.print(),
    enrollmentMonth,
    nowMonth,
    locale,
    labels: t,
    loading,
  };
}
