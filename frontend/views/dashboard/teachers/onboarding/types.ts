import type { CreateTeacherMutation } from "@/frontend/graphql/generated/gql/operations";

export {
  CountryCode,
  Gender,
  type TeacherOnboardingInput,
} from "@/frontend/graphql/generated/gql/graphql-types";
export type TeacherOnboardingCreateResult = NonNullable<CreateTeacherMutation["createTeacher"]>;
export type { TeacherOnboardingFormData } from "@/frontend/types/shared.types";
