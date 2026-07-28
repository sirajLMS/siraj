import type { WeeklyAvailabilityGridLabels } from "@/frontend/common/views/dashboard/teachers/availability/types";
import type { TeacherAvailabilityLabels } from "@/shared/locale/types/dashboard/teachers/availability";

export type TeacherAvailabilityShellLabels = Omit<TeacherAvailabilityLabels, "table">;

export interface TeacherAvailabilityLabelsBySection {
  readonly shell: TeacherAvailabilityShellLabels;
  readonly table: WeeklyAvailabilityGridLabels;
}
