"use client";

import type {
  AssociatedStudents,
  AssociatedStudentsSectionLabels,
  AssociatedStudentsSectionVariantProps,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface UseAssociatedStudentsSectionViewModelProps {
  readonly associatedStudents: AssociatedStudents;
  readonly loading?: boolean;
}

export interface AssociatedStudentsSectionViewModel extends AssociatedStudentsSectionVariantProps {
  readonly hasRows: boolean;
  readonly showLoadingFallback: boolean;
}

export function useAssociatedStudentsSectionViewModel(
  props: Readonly<UseAssociatedStudentsSectionViewModelProps>
): AssociatedStudentsSectionViewModel {
  const parent = useAppTranslation(Translation.Profile.Parent);
  const base = useAppTranslation(Translation.Profile.Base);
  const labels: AssociatedStudentsSectionLabels = { parent, base };

  const { associatedStudents, loading = false } = props;
  const rows = associatedStudents?.rows ?? [];
  const hasRows = rows.length > 0;
  const showLoadingFallback = loading && !associatedStudents;

  return {
    labels,
    rows,
    loading,
    emptyMessage: parent.students.empty,
    hasRows,
    showLoadingFallback,
  };
}
