import type { ParentOnboardingInput, ParentOnboardingResult } from "@/frontend/graphql/generated/gql/graphql-types";

export type { ParentOnboardingInput, ParentOnboardingResult };

type CleanField<T> = T extends null ? undefined : T;
type CleanInput<T> = {
  [K in keyof T as undefined extends CleanField<T[K]> ? K : never]?: CleanField<T[K]>;
} & {
  [K in keyof T as undefined extends CleanField<T[K]> ? never : K]: CleanField<T[K]>;
};

// Derived directly from generated GQL input type using Omit
export type ParentOnboardingFormData = Omit<
  CleanInput<ParentOnboardingInput>,
  | "password"
  | "name"
  | "defaultZoomLink"
  | "invoiceType"
  | "paymentMethod"
  | "phone"
  | "address"
  | "feeAmount"
  | "currency"
  | "timezone"
> & {
  fullName: string;
  zoomId?: string;
  invoiceType: string;
  paymentMethod: string;
  phone: string;
  address: string;
  feeAmount: string;
  currency: string;
};
