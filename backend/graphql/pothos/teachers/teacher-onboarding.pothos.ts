import type { CountryCode, Gender } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { UserPaymentMethodInitialInputPothos, type UserPaymentMethodInitialGqlInput } from "@/backend/graphql/pothos/billing/payment-method.pothos";
import {
  CountryCodePothosObject,
  CurrencyCodePothosObject,
  GenderPothosObject,
  IanaTimezonePothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import type { Email } from "@/backend/lib/email";
import type { TeacherOnboardingInput } from "@/backend/services/teacher/teacher-onboarding.service";
import type { TeacherOnboardingReturnType } from "@/backend/types/teachers/teacher-onboarding.types";

export interface TeacherOnboardingGqlInput
  extends Omit<TeacherOnboardingInput, "email" | "gender" | "countryCode" | "initialPayoutMethod"> {
  email: Email;
  gender?: Gender | null;
  countryCode?: CountryCode | null;
  initialPayoutMethod?: UserPaymentMethodInitialGqlInput | null;
}

export const TeacherOnboardingInputPothosObject = gqlSchemaBuilder
  .inputRef<TeacherOnboardingGqlInput>("TeacherOnboardingInput")
  .implement({
    description: "Input for creating a new teacher account with comprehensive profile",
    fields: t => ({
      name: t.string({
        required: true,
        description: "Teacher full name",
        directives: { constraint: { maxLength: 512 } },
      }),
      email: t.field({ type: "Email", required: true, description: "Teacher email address" }),
      password: t.string({
        required: true,
        description: "Teacher password",
        directives: { constraint: { maxLength: 128 } },
      }),
      nationality: t.string({
        description: "Teacher nationality (country code)",
        directives: { constraint: { maxLength: 512 } },
      }),
      nationalId: t.string({
        description: "Teacher national ID (encrypted)",
        directives: { constraint: { maxLength: 512 } },
      }),
      phone: t.string({ description: "Teacher phone number", directives: { constraint: { maxLength: 512 } } }),
      dateOfBirth: t.string({
        description: "Teacher date of birth (ISO date string)",
        directives: { constraint: { maxLength: 512 } },
      }),
      gender: t.field({
        type: GenderPothosObject,
        description: "Teacher gender",
      }),
      address: t.string({ description: "Teacher address", directives: { constraint: { maxLength: 2000 } } }),
      qualifications: t.string({
        description: "Teacher qualifications",
        directives: { constraint: { maxLength: 2000 } },
      }),
      countryCode: t.field({
        type: CountryCodePothosObject,
        description: "Teacher country code",
      }),
      timezone: t.field({ type: IanaTimezonePothosObject, required: true }),
      hourlyRate: t.string({ description: "Teacher hourly rate", directives: { constraint: { maxLength: 512 } } }),
      rateCurrency: t.field({
        type: CurrencyCodePothosObject,
        description: "Currency for hourly rate",
      }),
      initialPayoutMethod: t.field({
        type: UserPaymentMethodInitialInputPothos,
        description: "Optional initial payout payment method for the teacher",
      }),
    }),
  });

const TeacherOnboardingRef = gqlSchemaBuilder.objectRef<TeacherOnboardingReturnType>("TeacherOnboarding");

export const TeacherOnboardingPothosObject = TeacherOnboardingRef.implement({
  description: "Teacher onboarding profile with resolved metadata",
  fields: t => ({
    id: t.exposeString("teacherId", {
      description: "Unique identifier for the teacher profile",
    }),
    userId: t.exposeString("userId", {
      description: "Created user ID for the onboarded teacher",
    }),
    name: t.exposeString("name", {
      description: "Resolved teacher display name",
    }),
    email: t.exposeString("email", {
      description: "Teacher email address",
    }),
    status: t.exposeString("status", {
      description: "Current teacher account status",
    }),
    gender: t.expose("gender", {
      type: GenderPothosObject,
      nullable: true,
      description: "Teacher gender",
    }),
    timezoneDisplay: t.exposeString("timezoneDisplay", {
      nullable: true,
      description: "Formatted timezone display string",
    }),
  }),
});
