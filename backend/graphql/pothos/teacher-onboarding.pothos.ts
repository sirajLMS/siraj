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
      name: t.string({ required: true, description: "Teacher full name" }),
      email: t.field({ type: "Email", required: true, description: "Teacher email address" }),
      password: t.string({ required: true, description: "Teacher password" }),
      nationality: t.string({ description: "Teacher nationality (country code)" }),
      nationalId: t.string({ description: "Teacher national ID (encrypted)" }),
      phone: t.string({ description: "Teacher phone number" }),
      dateOfBirth: t.string({ description: "Teacher date of birth (ISO date string)" }),
      gender: t.field({
        type: GenderPothosObject,
        description: "Teacher gender",
      }),
      address: t.string({ description: "Teacher address" }),
      qualifications: t.string({ description: "Teacher qualifications" }),
      skypeId: t.string({ description: "Teacher Skype ID" }),
      zoomLink: t.string({ description: "Teacher Zoom meeting link" }),
      zoomUsername: t.string({ description: "Teacher Zoom username" }),
      zoomPassword: t.string({ description: "Teacher Zoom password (encrypted)" }),
      countryCode: t.field({
        type: CountryCodePothosObject,
        description: "Teacher country code",
      }),
      timezoneId: t.int({ description: "Timezone ID reference" }),
      timezone: t.string({ required: true, description: "IANA timezone identifier" }),
      hourlyRate: t.string({ description: "Teacher hourly rate" }),
      rateCurrency: t.string({ description: "Currency for hourly rate" }),
      beneficiaryName: t.string({ description: "Banking beneficiary name" }),
      bankName: t.string({ description: "Bank name" }),
      accountNumber: t.string({ description: "Bank account number" }),
      routingNumber: t.string({ description: "Bank routing number" }),
      swiftBic: t.string({ description: "SWIFT/BIC code" }),
      iban: t.string({ description: "IBAN" }),
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
