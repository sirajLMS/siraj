import { z } from "zod";
import { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { isValidIanaTimezoneId } from "@/frontend/lib/timezone";
import { CountryCode, Gender } from "@/frontend/views/dashboard/teachers/onboarding/types";

export type { TeacherOnboardingFormData } from "@/frontend/views/dashboard/teachers/onboarding/types";

export const teacherOnboardingSchema = (validationLabels: {
  readonly fullNameRequired: string;
  readonly emailRequired: string;
  readonly emailInvalid: string;
  readonly nationalIdRequired: string;
  readonly phoneRequired: string;
  readonly genderRequired: string;
  readonly countryRequired: string;
  readonly timezoneRequired: string;
  readonly salaryAmountRequired: string;
  readonly currencyRequired: string;
  readonly beneficiaryNameRequired: string;
  readonly bankNameRequired: string;
  readonly accountNumberRequired: string;
  readonly ibanRequired: string;
  readonly urlInvalid: string;
}) =>
  z.object({
    name: z.string().min(1, validationLabels.fullNameRequired),
    email: z.email({ message: validationLabels.emailInvalid }),
    nationality: z.string().optional(),
    nationalId: z.string().min(1, validationLabels.nationalIdRequired),
    phone: z.string().min(1, validationLabels.phoneRequired),
    dateOfBirth: z.string().optional(),
    gender: z.custom<Gender>(val => typeof val === "string" && Object.values(Gender).includes(val as Gender), {
      message: validationLabels.genderRequired,
    }),
    address: z.string().optional(),
    qualifications: z.string().optional(),
    zoomLink: z.url({ message: validationLabels.urlInvalid }).or(z.literal("")).optional(),
    countryCode: z.custom<CountryCode>(
      val => typeof val === "string" && Object.values(CountryCode).includes(val as CountryCode),
      { message: validationLabels.countryRequired }
    ),
    zoomUsername: z.string().optional(),
    zoomPassword: z.string().optional(),
    timezone: z
      .string()
      .min(1, validationLabels.timezoneRequired)
      .refine(value => isValidIanaTimezoneId(value), { message: validationLabels.timezoneRequired }),
    hourlyRate: z.string().min(1, validationLabels.salaryAmountRequired),
    rateCurrency: z.enum(CurrencyCode).refine(v => !!v, { message: validationLabels.currencyRequired }),
    beneficiaryName: z.string().min(1, validationLabels.beneficiaryNameRequired),
    bankName: z.string().min(1, validationLabels.bankNameRequired),
    accountNumber: z.string().min(1, validationLabels.accountNumberRequired),
    routingNumber: z.string().optional(),
    swiftBic: z.string().optional(),
    iban: z.string().min(1, validationLabels.ibanRequired),
  });
