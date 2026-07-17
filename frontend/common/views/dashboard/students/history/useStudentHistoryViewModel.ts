"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { studentClassHistoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-history.documents";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import type { ClassSession, StudentHistoryMetrics } from "@/frontend/common/views/dashboard/students/history/types";
import { mapStudentHistoryMetrics } from "@/frontend/common/views/dashboard/students/history/utils/studentHistoryMappers";
import { type StudentHistoryLabels, useAppTranslation } from "@/shared/locale";

function useStudentHistoryLabels(t: StudentHistoryLabels): StudentHistoryLabels {
  return t;
}

export interface UseStudentHistoryViewModelProps {
  readonly studentId: string;
}

export interface StudentHistoryViewModel {
  readonly studentName: string;
  readonly currentMonth: Date;
  readonly metrics: StudentHistoryMetrics;
  readonly classes: Readonly<Partial<Record<number, ClassSession>>>;
  readonly selectedWeek: number;
  readonly selectedDay: number | null;
  readonly embedded?: boolean;
  readonly onSelectWeek: (week: number) => void;
  readonly onSelectDay: (day: number | null) => void;
  readonly onPrevMonth: () => void;
  readonly onNextMonth: () => void;
  readonly onPrint: () => void;
  readonly enrollmentMonth?: Date;
  readonly nowMonth?: Date;
  readonly locale: string;
  readonly labels: StudentHistoryLabels;
  readonly loading: boolean;
}

export function useStudentHistoryViewModel(props: Readonly<UseStudentHistoryViewModelProps>): StudentHistoryViewModel {
  const { studentId } = props;
  const t = useAppTranslation().dashboardTranslations.studentHistory;
  const labels = useStudentHistoryLabels(t);

  const { data: profileData, loading: profileLoading } = useQuery(studentProfileQueryDocument, {
    variables: { studentId, year: null, month: null },
    fetchPolicy: "cache-and-network",
    skip: !studentId,
  });

  const { data: historyData, loading: historyLoading } = useQuery(studentClassHistoryQueryDocument, {
    variables: {
      studentId,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    },
    skip: !studentId,
    fetchPolicy: "cache-and-network",
  });

  const metrics: StudentHistoryMetrics = useMemo(
    () => mapStudentHistoryMetrics(historyData?.studentClassHistory?.metrics ?? null),
    [historyData]
  );

  const loading = profileLoading || historyLoading;

  // TODO: Derive studentName, currentMonth, classes, etc. from profileData and historyData
  // For now, returning a basic structure that matches the view components
  return {
    studentName: profileData?.studentProfile?.name ?? "Student",
    currentMonth: new Date(),
    metrics,
    classes: {}, // Will need to be derived from sessions
    selectedWeek: 1,
    selectedDay: null,
    embedded: false,
    onSelectWeek: () => {},
    onSelectDay: () => {},
    onPrevMonth: () => {},
    onNextMonth: () => {},
    onPrint: () => {},
    enrollmentMonth: undefined,
    nowMonth: undefined,
    locale: "en",
    labels,
    loading,
  };
}
