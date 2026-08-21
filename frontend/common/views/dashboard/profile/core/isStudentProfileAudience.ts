import { ProfileAudience } from "@/shared/constants/profile.enum";

/** GraphQL profile audience for students (backend enum value is lowercase `student`). */
export const PROFILE_AUDIENCE_STUDENT = ProfileAudience.STUDENT;

export function isStudentProfileAudience(audience: ProfileAudience): boolean {
  return audience === PROFILE_AUDIENCE_STUDENT;
}
