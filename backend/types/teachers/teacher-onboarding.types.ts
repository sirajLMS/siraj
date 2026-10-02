import type { CountryCode, Gender } from "@/backend/enum";
import type { Email } from "@/backend/lib/email";
import type { UserPaymentMethodInitialGqlInput, UserPaymentMethodSubmitInput } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import type { NationalIdValue } from "@/shared/lib/national-id";

/**
 * Input for teacher onboarding — canonical interface shared across
 * service, GraphQL (Pothos), and seed layers.
 */
export interface TeacherOnboardingInput {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly avatarUrl?: string | null;
  readonly nationality?: string | null;
  readonly nationalId?: NationalIdValue | null;
  readonly phone?: string | null;
  readonly dateOfBirth?: string | null;
  readonly gender?: Gender | null;
  readonly address?: string | null;
  readonly qualifications?: string | null;
  readonly countryCode?: string | null;
  readonly timezoneId?: number | null;
  readonly timezone: string;
  readonly hourlyRate?: string | null;
  readonly rateCurrency?: CurrencyCode | null;
  readonly displayCurrency?: CurrencyCode | null;
  readonly initialPayoutMethod?: Omit<UserPaymentMethodSubmitInput, "userId"> | null;
}

/**
 * Result of teacher onboarding — canonical interface shared across
 * service, GraphQL (Pothos), and test layers.
 */
export interface TeacherOnboardingResult {
  readonly userId: string;
  readonly teacherId: string;
  readonly name: string;
  readonly email: string;
  readonly status: string;
  readonly phone?: string | null;
  readonly gender?: Gender | null;
}

/**
 * TeacherOnboardingReturnType:
 * - Core return type for Teacher Onboarding entity.
 * - Omits internal/reserved fields.
 * - Reapplies proper enum types.
 * - Exposes resolved properties (e.g., formatted display fields).
 */
export type TeacherOnboardingReturnType = TeacherOnboardingResult & {
  /**
   * Properly typed gender enum for GraphQL/resolver usage.
   */
  gender?: Gender | null;

  /**
   * Formatted display name for UI consistency.
   * Resolved from first/last name splits if needed.
   */
  displayName?: string;

  /**
   * Formatted timezone display string (e.g., "UTC+3: Cairo").
   */
  timezoneDisplay?: string;
};

/**
 * GraphQL-specific onboarding input for teachers.
 * Replaces `email`, `gender`, `countryCode`, and `initialPayoutMethod`
 * with GraphQL-typed equivalents (Email scalar, enum types, and Pothos input ref).
 */
export interface TeacherOnboardingGqlInput
  extends Omit<TeacherOnboardingInput, "email" | "gender" | "countryCode" | "initialPayoutMethod"> {
  email: Email;
  gender?: Gender | null;
  countryCode?: CountryCode | null;
  initialPayoutMethod?: UserPaymentMethodInitialGqlInput | null;
}
