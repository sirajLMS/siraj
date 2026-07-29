import type { ProfileStudentsLabels } from "@/shared/locale/types/profile";

export type AssignedStudentsColumnLabels = ProfileStudentsLabels["columns"];

export interface AssignedStudentsListShellLabels {
  readonly mobileEmptyMessage: string;
  readonly desktopEmptyMessage: string;
}

export interface AssignedStudentsListLabels {
  readonly columns: AssignedStudentsColumnLabels;
  readonly emptyMessage: string;
}
