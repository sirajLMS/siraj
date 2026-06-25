import type { ParentOnboardingInput } from "@/frontend/graphql/generated/gql/graphql-types";
import { InvoiceType, PaymentMethod } from "@/frontend/graphql/generated/gql/graphql-types";

export type { ParentOnboardingResult } from "@/frontend/graphql/generated/gql/graphql-types";
export type { ParentOnboardingInput };
export { InvoiceType, PaymentMethod };

type CleanField<T> = T extends null ? undefined : T;
type CleanInput<T> = {
  [K in keyof T as undefined extends CleanField<T[K]> ? K : never]?: CleanField<T[K]>;
} & {
  [K in keyof T as undefined extends CleanField<T[K]> ? never : K]: CleanField<T[K]>;
};

// Derived directly from generated GQL input type using Omit
export type ParentOnboardingFormData = Omit<
  CleanInput<ParentOnboardingInput>,
  "password" | "phone" | "address" | "feeAmount" | "currency" | "invoiceType" | "paymentMethod"
> & {
  phone: string;
  address: string;
  feeAmount: string;
  currency: string;
  invoiceType: InvoiceType;
  paymentMethod: PaymentMethod;
};
