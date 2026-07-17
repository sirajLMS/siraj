"use client";

import { useQuery } from "@apollo/client/react";
import { parentAssignedStudentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/parents/parent-portal.documents";
import type { ParentStudentsLabels } from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale";

export interface ParentStudentRow {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly teacherName?: string | null;
  readonly classesRemaining?: number | null;
  readonly classesTotal?: number | null;
  readonly hoursPerWeek?: string | null;
}

export interface ParentStudentsViewModel {
  readonly labels: ParentStudentsLabels;
  readonly loading: boolean;
  readonly error: boolean;
  readonly rows: readonly ParentStudentRow[];
}

export type UseParentStudentsViewModelProps = Record<string, never>;

export function useParentStudentsViewModel(_props: Readonly<UseParentStudentsViewModelProps>): ParentStudentsViewModel {
  const labels = useAppTranslation().dashboardTranslations.parentStudents;
  const { data, loading, error } = useQuery(parentAssignedStudentsQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const rows =
    data?.parentAssignedStudents?.rows?.map(r => ({
      id: r?.id ?? "",
      name: r?.name ?? "",
      status: r?.status ?? "",
      teacherName: r?.teacherName ?? null,
      classesRemaining: r?.classesRemaining ?? null,
      classesTotal: r?.classesTotal ?? null,
      hoursPerWeek: r?.hoursPerWeek ?? null,
    })) ?? [];

  return {
    labels,
    loading,
    error: !!error,
    rows,
  };
}
