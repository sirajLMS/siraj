import type { StudentProfileLabels } from "@/shared/locale/types/dashboard/students/profile";

type StudentProfilePageShellLabels = Pick<
  StudentProfileLabels,
  "title" | "loading" | "notFoundTitle" | "notFoundDescription"
>;

type StudentProfilePageTabLabels = StudentProfileLabels["tabs"];

export interface StudentProfilePageLabelsBySection {
  readonly shell: StudentProfilePageShellLabels;
  readonly tabs: StudentProfilePageTabLabels;
}
