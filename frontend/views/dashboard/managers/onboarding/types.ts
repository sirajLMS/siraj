import type { ManagerOnboardingInput } from "@/frontend/graphql/generated/gql/graphql-types";

export type { ManagerOnboardingResult } from "@/frontend/graphql/generated/gql/graphql-types";
export { ManagerAccountType } from "@/frontend/graphql/generated/gql/graphql-types";

type CleanField<T> = T extends null ? undefined : T;
type CleanInput<T> = {
  [K in keyof T as undefined extends CleanField<T[K]> ? K : never]?: CleanField<T[K]>;
} & {
  [K in keyof T as undefined extends CleanField<T[K]> ? never : K]: CleanField<T[K]>;
};

export type ManagerOnboardingFormData = CleanInput<ManagerOnboardingInput>;
