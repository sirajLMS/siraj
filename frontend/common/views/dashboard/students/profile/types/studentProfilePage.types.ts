import type { StudentProfileLabels } from "@/shared/locale/types/dashboard/students/profile";

export type StudentProfilePageShellLabels = Pick<
  StudentProfileLabels,
  "title" | "loading" | "notFoundTitle" | "notFoundDescription"
>;

export type StudentProfilePageTabLabels = StudentProfileLabels["tabs"];

export interface StudentProfilePageLabelsBySection {
  readonly shell: StudentProfilePageShellLabels;
  readonly tabs: StudentProfilePageTabLabels;
}
