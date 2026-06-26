import type { TeacherProfileFormData } from "@/frontend/views/dashboard/teachers/profile/schemas/teacherProfileSchema";

export interface TeacherProfileData extends TeacherProfileFormData {
  readonly id: string;
  readonly lastModified: string;
  readonly totalClasses: number;
  readonly parentRating: string;
}
