import { z } from "zod";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import { isValidIanaTimezoneId } from "@/frontend/common/lib/timezone";
import { onboardingPaymentMethodSchema } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/paymentMethodFormSchema";
import { CountryCode, Gender } from "@/frontend/common/views/dashboard/teachers/onboarding/types";

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
  readonly urlInvalid: string;
}) =>
  z
    .object({
      name: z.string().min(1, validationLabels.fullNameRequired),
      email: z.email({ message: validationLabels.emailInvalid }),
      avatarUrl: z.string().optional(),
      nationality: z.string().optional(),
      nationalId: z.string().min(1, validationLabels.nationalIdRequired),
      phone: z.string().min(1, validationLabels.phoneRequired),
      dateOfBirth: z.string().optional(),
      gender: z.custom<Gender>(
        val => typeof val === "string" && (Object.values(Gender) as readonly string[]).includes(val),
        {
          message: validationLabels.genderRequired,
        }
      ),
      address: z.string().optional(),
      qualifications: z.string().optional(),
      countryCode: z.custom<CountryCode>(
        val => typeof val === "string" && Object.values(CountryCode).includes(val as CountryCode),
        { message: validationLabels.countryRequired }
      ),
      timezone: z
        .string()
        .min(1, validationLabels.timezoneRequired)
        .refine(value => isValidIanaTimezoneId(value), { message: validationLabels.timezoneRequired }),
      hourlyRate: z.string().min(1, validationLabels.salaryAmountRequired),
      rateCurrency: z.enum(CurrencyCode).refine(v => !!v, { message: validationLabels.currencyRequired }),
      payoutMethod: onboardingPaymentMethodSchema,
      meetingProvider: z.custom<MeetingProviderFieldsFragment | null>().nullable().optional(),
      meetingUrl: z.string().optional(),
      meetingLabel: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      const hasUrl = Boolean(data.meetingUrl?.trim());
      const hasProvider = Boolean(data.meetingProvider?.id);
      if (hasUrl && !hasProvider) {
        ctx.addIssue({
          code: "custom",
          message: validationLabels.urlInvalid,
          path: ["meetingProvider"],
        });
      }
      if (hasUrl && data.meetingUrl) {
        try {
          new URL(data.meetingUrl);
        } catch {
          ctx.addIssue({
            code: "custom",
            message: validationLabels.urlInvalid,
            path: ["meetingUrl"],
          });
        }
      }
    });
