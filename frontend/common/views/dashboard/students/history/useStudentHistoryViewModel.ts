"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { studentClassHistoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-history.documents";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import type { StudentHistoryMetrics } from "@/frontend/common/views/dashboard/students/history/types";
import type { StudentHistoryViewProps } from "@/frontend/common/views/dashboard/students/history/types/studentHistoryViewProps";
import { mapStudentHistoryMetrics } from "@/frontend/common/views/dashboard/students/history/utils/studentHistoryMappers";
import { type StudentHistoryLabels, Translation, useAppTranslation } from "@/shared/locale";

function resolveStudentHistoryLabels(t: StudentHistoryLabels): StudentHistoryLabels {
  return t;
}

export interface UseStudentHistoryViewModelProps {
  readonly studentId: string;
}

export interface StudentHistoryViewModel extends StudentHistoryViewProps {
  readonly labels: StudentHistoryLabels;
  readonly loading: boolean;
}

export function useStudentHistoryViewModel(props: Readonly<UseStudentHistoryViewModelProps>): StudentHistoryViewModel {
  const { studentId } = props;
  const t = useAppTranslation(Translation.Dashboard.StudentHistory);
  const labels = resolveStudentHistoryLabels(t);

  const { data: profileData, loading: profileLoading } = useQuery(studentProfileQueryDocument, {
    variables: { studentId, year: null, month: null, includeUpcomingClasses: true },
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

  // Derivation of studentName / currentMonth / classes from profileData and
  // historyData is intentionally deferred — returning a basic structure that
  // matches the view components until the rollout is complete.
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
