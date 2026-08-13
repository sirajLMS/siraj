"use client";

import { useQuery } from "@apollo/client/react";
import { parentAssignedStudentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/parents/parent-portal.documents";
import type { StudentAccountStatus } from "@/frontend/common/views/dashboard/admin/parents/students/types";
import { mapStudentAccountStatus } from "@/frontend/common/views/dashboard/admin/parents/students/utils";
import { type ParentStudentsLabels, Translation, useAppTranslation } from "@/shared/locale";

export interface ParentStudentRow {
  readonly id: string;
  readonly name: string;
  readonly studentAvatarUrl?: string | null;
  readonly status: string;
  readonly accountStatus: StudentAccountStatus;
  readonly isDeactivated: boolean;
  readonly classesRemaining: number;
  readonly classesTotal: number;
  readonly hoursPerWeek: number;
}

export interface ParentStudentsViewModel {
  readonly labels: ParentStudentsLabels;
  readonly loading: boolean;
  readonly error: boolean;
  readonly rows: readonly ParentStudentRow[];
}

export type UseParentStudentsViewModelProps = Record<string, never>;

export function useParentStudentsViewModel(_props: Readonly<UseParentStudentsViewModelProps>): ParentStudentsViewModel {
  const labels = useAppTranslation(Translation.Dashboard.ParentStudents);
  const { data, loading, error } = useQuery(parentAssignedStudentsQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const rows =
    data?.parentAssignedStudents?.rows?.map(r => {
      const accountStatus = mapStudentAccountStatus(r?.status);
      return {
        id: r?.id ?? "",
        name: r?.name ?? "",
        studentAvatarUrl: r?.studentAvatarUrl ?? null,
        status: r?.status ?? "",
        accountStatus,
        isDeactivated: accountStatus === "deactivated",
        classesRemaining: r?.classesRemaining ?? 0,
        classesTotal: r?.classesTotal ?? 0,
        hoursPerWeek: Number(r?.hoursPerWeek ?? 0),
      };
    }) ?? [];

  return {
    labels,
    loading,
    error: !!error,
    rows,
  };
}
