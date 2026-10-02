import { z } from "zod";
import {
  CountryCode,
  CurrencyCode,
  Gender,
  type MeetingProviderFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { validateMeetingProviderFields } from "@/frontend/common/views/dashboard/profile/shared/meetingProviderValidation";
import { onboardingPaymentMethodSchema } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/paymentMethodFormSchema";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import type { TeacherOnboardingLabels } from "@/shared/locale";
import { createPasswordFieldSchema } from "@/shared/utils/password-schema";

export const teacherOnboardingSchema = (validationLabels: TeacherOnboardingLabels["validation"]) =>
  z
    .object({
      name: z.string().min(1, validationLabels.fullNameRequired),
      email: z.email({ message: validationLabels.emailInvalid }),
      password: createPasswordFieldSchema({
        required: validationLabels.passwordRequired,
        minLength: validationLabels.passwordMinLength,
        weakComplexity: validationLabels.passwordWeakComplexity,
      }),
      avatarUrl: z.string().optional(),
      nationality: z.string().optional(),
      nationalId: z
        .object({
          countryCode: z.string().nullable().optional(),
          number: z.string(),
        })
        .optional(),
      phone: z.string().max(50, validationLabels.phoneMaxLength).optional(),
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
        val => typeof val === "string" && (Object.values(CountryCode) as readonly string[]).includes(val),
        { message: validationLabels.countryRequired }
      ),
      timezone: z.custom<IanaTimezone>(
        val => typeof val === "string" && (Object.values(IanaTimezone) as readonly string[]).includes(val),
        {
          message: validationLabels.timezoneRequired,
        }
      ),
      displayCurrency: z.enum(CurrencyCode).optional().nullable(),
      hourlyRate: z.string().min(1, validationLabels.salaryAmountRequired),
      rateCurrency: z.enum(CurrencyCode).refine(v => !!v, { message: validationLabels.currencyRequired }),
      payoutMethod: onboardingPaymentMethodSchema.optional().nullable(),
      meetingProvider: z.custom<MeetingProviderFieldsFragment | null>().nullable().optional(),
      meetingUrl: z.string().optional(),
      meetingLabel: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      validateMeetingProviderFields(data, ctx, {
        meetingProviderRequired: validationLabels.meetingProviderRequired,
        meetingUrlRequired: validationLabels.meetingUrlRequired,
        meetingUrlInvalid: validationLabels.urlInvalid,
      });
    });

export type TeacherOnboardingFormData = z.infer<ReturnType<typeof teacherOnboardingSchema>>;
