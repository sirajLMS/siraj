import type { TeacherFutureScheduleLabels } from "@/shared/locale/types/dashboard/teachers/futureSchedule";

export interface FutureScheduleSupportContactLabels {
  readonly supportContact: string;
  readonly contactAdmin: string;
}

export interface FutureScheduleLabelsBySection {
  readonly schedule: TeacherFutureScheduleLabels;
  readonly supportContact: FutureScheduleSupportContactLabels;
}
