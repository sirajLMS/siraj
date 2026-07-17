"use client";

import { useQuery } from "@apollo/client/react";
import type { ApolloError } from "@apollo/client";
import type { TeacherAssignedStudentsQuery_teacherAssignedStudents_TeacherAssignedStudentsResult_rows_TeacherAssignedStudent } from "@/frontend/common/graphql/generated/gql/operations";
import { teacherAssignedStudentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useAppTranslation } from "@/shared/locale";

/**
 * TeacherStudents ViewModel.
 *
 * Pulls the assigned-students list via `useQuery` and exposes the localized
 * labels alongside the row data. Both tier views consume the same flat shape;
 * no viewport logic lives here.
 */

type TeacherStudentRow = TeacherAssignedStudentsQuery_teacherAssignedStudents_TeacherAssignedStudentsResult_rows_TeacherAssignedStudent;

export interface TeacherStudentsViewModel {
  readonly rows: readonly TeacherStudentRow[];
  readonly loading: boolean;
  readonly error: ApolloError | undefined;
  readonly labels: TeacherStudentsLabels;
}

export interface TeacherStudentsLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly noStudents: string;
  readonly statusLabel: (status: string) => string;
  readonly quotaLabel: (remaining: number, total: number) => string;
  readonly hoursLabel: (hours: number) => string;
  readonly failedToLoad: string;
}

export type UseTeacherStudentsViewModelProps = Record<string, never>;

export function useTeacherStudentsViewModel(_props: Readonly<UseTeacherStudentsViewModelProps> = {}): TeacherStudentsViewModel {
  const t = useAppTranslation().dashboardTranslations.teacherStudents;
  const { data, loading, error } = useQuery(teacherAssignedStudentsQueryDocument);

  const rows = data?.teacherAssignedStudents?.rows ?? [];

  return {
    rows,
    loading,
    error,
    labels: {
      pageTitle: t.pageTitle,
      pageSubtitle: t.pageSubtitle,
      noStudents: t.noStudents,
      statusLabel: t.statusLabel,
      quotaLabel: t.quotaLabel,
      hoursLabel: t.hoursLabel,
      failedToLoad: t.errors.failedToLoad,
    },
  };
}
