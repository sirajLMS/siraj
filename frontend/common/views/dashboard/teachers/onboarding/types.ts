import type { CreateTeacherMutation } from "@/frontend/common/graphql/generated/gql/operations";

export {
  CountryCode,
  Gender,
  type TeacherOnboardingInput,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
export type TeacherOnboardingCreateResult = NonNullable<CreateTeacherMutation["createTeacher"]>;
