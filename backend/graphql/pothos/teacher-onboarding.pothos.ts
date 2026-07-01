import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type { Email } from "@/backend/lib/email";
import type {
  TeacherOnboardingInput,
  TeacherOnboardingResult,
} from "@/backend/services/teacher/teacher-onboarding.service";
import type { CountryCode, Gender } from "@/shared/lib/enum";
import { CountryCodePothosObject, GenderPothosObject } from "./enum.pothos";

export interface TeacherOnboardingGqlInput extends Omit<TeacherOnboardingInput, "email" | "gender" | "countryCode"> {
  email: Email;
  gender?: Gender | null;
  countryCode?: CountryCode | null;
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
      skypeId: t.string({ description: "Teacher Skype ID", directives: { constraint: { maxLength: 512 } } }),
      zoomLink: t.string({ description: "Teacher Zoom meeting link", directives: { constraint: { maxLength: 2000 } } }),
      zoomUsername: t.string({ description: "Teacher Zoom username", directives: { constraint: { maxLength: 512 } } }),
      zoomPassword: t.string({
        description: "Teacher Zoom password (encrypted)",
        directives: { constraint: { maxLength: 512 } },
      }),
      countryCode: t.field({
        type: CountryCodePothosObject,
        description: "Teacher country code",
      }),
      timezoneId: t.int({ description: "Timezone ID reference" }),
      timezone: t.string({
        required: true,
        description: "IANA timezone identifier",
        directives: { constraint: { maxLength: 512 } },
      }),
      hourlyRate: t.string({ description: "Teacher hourly rate", directives: { constraint: { maxLength: 512 } } }),
      rateCurrency: t.string({
        description: "Currency for hourly rate",
        directives: { constraint: { maxLength: 512 } },
      }),
      beneficiaryName: t.string({
        description: "Banking beneficiary name",
        directives: { constraint: { maxLength: 512 } },
      }),
      bankName: t.string({ description: "Bank name", directives: { constraint: { maxLength: 512 } } }),
      accountNumber: t.string({ description: "Bank account number", directives: { constraint: { maxLength: 512 } } }),
      routingNumber: t.string({ description: "Bank routing number", directives: { constraint: { maxLength: 512 } } }),
      swiftBic: t.string({ description: "SWIFT/BIC code", directives: { constraint: { maxLength: 512 } } }),
      iban: t.string({ description: "IBAN", directives: { constraint: { maxLength: 512 } } }),
    }),
  });

export const TeacherOnboardingResultPothosObject = gqlSchemaBuilder
  .objectRef<TeacherOnboardingResult>("TeacherOnboardingResult")
  .implement({
    description: "Result of teacher onboarding operation",
    fields: t => ({
      userId: t.exposeString("userId", { description: "Created user ID" }),
      teacherId: t.exposeString("teacherId", { description: "Created teacher profile ID" }),
      name: t.exposeString("name", { description: "Teacher name" }),
      email: t.exposeString("email", { description: "Teacher email" }),
      status: t.exposeString("status", { description: "Teacher account status" }),
    }),
  });
