import type { TeacherOnboardingInput, TeacherOnboardingResult } from "@/frontend/graphql/generated/gql/graphql-types";

export type { TeacherOnboardingInput, TeacherOnboardingResult };

type CleanField<T> = T extends null ? undefined : T;
type CleanInput<T> = {
  [K in keyof T as undefined extends CleanField<T[K]> ? K : never]?: CleanField<T[K]>;
} & {
  [K in keyof T as undefined extends CleanField<T[K]> ? never : K]: CleanField<T[K]>;
};

// Derived directly from generated GQL input type using Omit
export type TeacherOnboardingFormData = Omit<
  CleanInput<TeacherOnboardingInput>,
  | "password"
  | "timezoneId"
  | "name"
  | "dateOfBirth"
  | "countryCode"
  | "hourlyRate"
  | "rateCurrency"
  | "gender"
  | "nationalId"
  | "phone"
  | "beneficiaryName"
  | "bankName"
  | "accountNumber"
  | "iban"
> & {
  fullName: string;
  age?: string;
  country: string;
  salaryAmount: string;
  currency: string;
  gender: "male" | "female" | "";
  nationalId: string;
  phone: string;
  beneficiaryName: string;
  bankName: string;
  accountNumber: string;
  iban: string;
};
