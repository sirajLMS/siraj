"use client";

import type { ParentStudentsLabels } from "@/shared/locale";

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

export type UseParentStudentsViewModelProps = ParentStudentsViewModel;

export function useParentStudentsViewModel(props: Readonly<UseParentStudentsViewModelProps>): ParentStudentsViewModel {
  const { labels, loading, error, rows } = props;
  return { labels, loading, error, rows };
}
