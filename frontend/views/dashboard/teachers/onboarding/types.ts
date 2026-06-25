import type { TeacherOnboardingInput } from "@/frontend/graphql/generated/gql/graphql-types";
import { CountryCode, Gender } from "@/frontend/graphql/generated/gql/graphql-types";

export type { TeacherOnboardingResult } from "@/frontend/graphql/generated/gql/graphql-types";
export type { TeacherOnboardingInput };
export { CountryCode, Gender };

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
  | "nationalId"
  | "phone"
  | "countryCode"
  | "timezone"
  | "hourlyRate"
  | "rateCurrency"
  | "beneficiaryName"
  | "bankName"
  | "accountNumber"
  | "iban"
  | "gender"
> & {
  nationalId: string;
  phone: string;
  countryCode: CountryCode;
  timezone: string;
  hourlyRate: string;
  rateCurrency: string;
  beneficiaryName: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  gender: Gender;
};
