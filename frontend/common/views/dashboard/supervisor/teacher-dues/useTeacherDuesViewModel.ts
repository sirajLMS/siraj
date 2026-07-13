"use client";

import type { TeacherDuesViewModel } from "@/frontend/common/views/dashboard/supervisor/teacher-dues/types/teacherDuesTypes";

export type { TeacherDuesViewModel };

export type UseTeacherDuesViewModelProps = TeacherDuesViewModel;

export function useTeacherDuesViewModel(props: Readonly<UseTeacherDuesViewModelProps>): TeacherDuesViewModel {
  return {
    rows: props.rows,
    loading: props.loading,
    markingPaid: props.markingPaid,
    selectedDueIds: props.selectedDueIds,
    labels: props.labels,
    onSelectDues: props.onSelectDues,
    onToggleDue: props.onToggleDue,
    onMarkPaid: props.onMarkPaid,
  };
}
