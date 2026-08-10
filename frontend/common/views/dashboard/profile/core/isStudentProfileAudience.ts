import { ProfileAudience } from "@/frontend/common/graphql/generated/gql/graphql-types";

/** GraphQL profile audience for students (backend enum value is lowercase `student`). */
export const PROFILE_AUDIENCE_STUDENT = ProfileAudience.Student;

export function isStudentProfileAudience(audience: ProfileAudience): boolean {
  return audience === PROFILE_AUDIENCE_STUDENT;
}
