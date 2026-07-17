"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { studentClassHistoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-history.documents";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import type { StudentHistoryLabels } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryLabels";
import type {
  StudentHistoryMetrics,
  StudentHistorySessionRow,
} from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
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
    }),
    [t]
  );
}

export interface StudentHistoryViewModel {
  readonly metrics: StudentHistoryMetrics;
  readonly sessions: readonly StudentHistorySessionRow[];
  readonly labels: StudentHistoryLabels;
  readonly loading: boolean;
  readonly onBackToDashboard: () => void;
}

export type UseStudentHistoryViewModelProps = Record<string, never>;

export function useStudentHistoryViewModel(_props: UseStudentHistoryViewModelProps): StudentHistoryViewModel {
  const t = useAppTranslation().dashboardTranslations.studentPortalHistory;
  const router = useRouter();
  const labels = useStudentHistoryLabels(t);

  const { data: profileData, loading: profileLoading } = useQuery(studentProfileQueryDocument, {
    variables: { studentId: null, year: null, month: null },
    fetchPolicy: "cache-and-network",
  });

  const studentId = profileData?.studentProfile?.id ?? null;

  const { data: historyData, loading: historyLoading } = useQuery(studentClassHistoryQueryDocument, {
    variables: {
      studentId: studentId ?? "",
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

  const sessions: readonly StudentHistorySessionRow[] = useMemo(
    () => mapStudentHistorySessions(historyData?.studentClassHistory?.sessions ?? null),
    [historyData]
  );

  const loading = profileLoading || historyLoading;

  return {
    metrics,
    sessions,
    labels,
    loading,
    onBackToDashboard: () => router.push("/students/me"),
  };
}
