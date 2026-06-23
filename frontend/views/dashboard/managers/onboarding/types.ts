import type { ManagerOnboardingInput, ManagerOnboardingResult } from "@/frontend/graphql/generated/gql/graphql-types";

export type { ManagerOnboardingInput, ManagerOnboardingResult };

export type ManagerAccountType = "admin" | "manager";

type CleanField<T> = T extends null ? undefined : T;
type CleanInput<T> = {
  [K in keyof T as undefined extends CleanField<T[K]> ? K : never]?: CleanField<T[K]>;
} & {
  [K in keyof T as undefined extends CleanField<T[K]> ? never : K]: CleanField<T[K]>;
};

// Derived directly from generated GQL input type using Omit
export type ManagerOnboardingFormData = Omit<
  CleanInput<ManagerOnboardingInput>,
  "password" | "name" | "accountType"
> & {
  fullName: string;
  accountType: ManagerAccountType;
  department: string;
};
