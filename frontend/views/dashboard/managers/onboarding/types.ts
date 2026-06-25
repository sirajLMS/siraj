import type { ManagerOnboardingInput } from "@/frontend/graphql/generated/gql/graphql-types";

export type { ManagerOnboardingResult } from "@/frontend/graphql/generated/gql/graphql-types";
export { ManagerAccountType } from "@/frontend/graphql/generated/gql/graphql-types";
export type { ManagerOnboardingInput };

type CleanField<T> = T extends null ? undefined : T;
type CleanInput<T> = {
  [K in keyof T as undefined extends CleanField<T[K]> ? K : never]?: CleanField<T[K]>;
} & {
  [K in keyof T as undefined extends CleanField<T[K]> ? never : K]: CleanField<T[K]>;
};

// Derived directly from generated GQL input type using Omit
export type ManagerOnboardingFormData = Omit<CleanInput<ManagerOnboardingInput>, "password"> & {
  department: string; // UI specific
};
