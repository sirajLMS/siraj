import type { InvoiceType } from "@/backend/enum";
import type { Email } from "@/backend/lib/email";
import type { UserPaymentMethodInitialGqlInput, UserPaymentMethodSubmitInput } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

export interface ParentOnboardingInput {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly avatarUrl?: string | null;
  readonly phone?: string | null;
  readonly nationality?: string | null;
  readonly address?: string | null;
  readonly facebook?: string | null;
  readonly whatsapp?: string | null;
  readonly twitter?: string | null;
  readonly invoiceType?: string | null;
  readonly feeAmount?: string | null;
  readonly initialPayinMethod?: Omit<UserPaymentMethodSubmitInput, "userId"> | null;
  readonly currency?: CurrencyCode | null;
  readonly timezone?: string | null;
  readonly displayCurrency?: CurrencyCode | null;
  readonly status?: string | null;
}

export interface ParentOnboardingResult {
  readonly userId: string;
  readonly parentId: string;
  readonly name: string;
  readonly email: string;
  readonly status: string;
  readonly invoiceType: string | null;
  readonly currency: CurrencyCode | null;
}

/**
 * GraphQL-specific onboarding input for parents.
 * Replaces `email`, `invoiceType`, `currency`, and `initialPayinMethod`
 * with GraphQL-typed equivalents (Email scalar, enum types, and Pothos input ref).
 */
export interface ParentOnboardingGqlInput
  extends Omit<ParentOnboardingInput, "email" | "invoiceType" | "currency" | "initialPayinMethod"> {
  email: Email;
  invoiceType?: InvoiceType | null;
  currency?: CurrencyCode | null;
  initialPayinMethod?: UserPaymentMethodInitialGqlInput | null;
}
