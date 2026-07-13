"use client";

import type {
  ReassignmentStudentData,
  ReassignmentSubmitInput,
  ReassignmentTeacherOption,
  StatusChangeInput,
  TeacherReassignmentViewProps,
} from "@/frontend/common/views/dashboard/teachers/reassignment/types";

export type UseTeacherReassignmentViewModelProps = TeacherReassignmentViewProps;

export interface TeacherReassignmentViewModel {
  readonly student: ReassignmentStudentData;
  readonly currentTeacherName: string;
  readonly teachers: readonly ReassignmentTeacherOption[];
  readonly isSubmitting: boolean;
  readonly onReassign: (input: ReassignmentSubmitInput) => Promise<void>;
  readonly onStatusChange: (input: StatusChangeInput) => Promise<void>;
  readonly onCancel: () => void;
}

export function useTeacherReassignmentViewModel(
  props: Readonly<UseTeacherReassignmentViewModelProps>
): TeacherReassignmentViewModel {
  const { student, currentTeacherName, teachers, isSubmitting, onReassign, onStatusChange, onCancel } = props;

  return {
    student,
    currentTeacherName,
    teachers,
    isSubmitting,
    onReassign,
    onStatusChange,
    onCancel,
  };
}
