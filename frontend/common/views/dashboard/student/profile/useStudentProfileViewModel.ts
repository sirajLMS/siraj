"use client";

import type { StudentProfileLabels } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileLabels";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";

export interface StudentProfileViewModel {
  readonly profile: StudentProfileRow | null;
  readonly labels: StudentProfileLabels;
  readonly loading: boolean;
  readonly onBackToDashboard: () => void;
}

export type UseStudentProfileViewModelProps = Omit<StudentProfileViewModel, never>;

export function useStudentProfileViewModel(props: UseStudentProfileViewModelProps): StudentProfileViewModel {
  return props;
}
