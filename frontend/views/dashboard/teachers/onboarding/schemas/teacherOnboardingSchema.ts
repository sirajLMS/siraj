import { z } from "zod";
import type { TeacherOnboardingFormData } from "../types";

export type { TeacherOnboardingFormData };

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
    fullName: z.string().min(1, validationLabels.fullNameRequired),
    email: z.email({ message: validationLabels.emailInvalid }),
    nationality: z.string().optional(),
    nationalId: z.string().min(1, validationLabels.nationalIdRequired),
    phone: z.string().min(1, validationLabels.phoneRequired),
    age: z.string().optional(),
    gender: z.enum(["male", "female", ""]).refine(val => val !== "", {
      message: validationLabels.genderRequired,
    }),
    address: z.string().optional(),
    qualifications: z.string().optional(),
    skypeId: z.string().optional(),
    zoomLink: z.url({ message: validationLabels.urlInvalid }).or(z.literal("")).optional(),
    country: z.string().min(1, validationLabels.countryRequired),
    zoomUsername: z.string().optional(),
    zoomPassword: z.string().optional(),
    timezone: z.string().min(1, validationLabels.timezoneRequired),
    salaryAmount: z.string().min(1, validationLabels.salaryAmountRequired),
    currency: z.string().min(1, validationLabels.currencyRequired),
    beneficiaryName: z.string().min(1, validationLabels.beneficiaryNameRequired),
    bankName: z.string().min(1, validationLabels.bankNameRequired),
    accountNumber: z.string().min(1, validationLabels.accountNumberRequired),
    routingNumber: z.string().optional(),
    swiftBic: z.string().optional(),
    iban: z.string().min(1, validationLabels.ibanRequired),
  });
