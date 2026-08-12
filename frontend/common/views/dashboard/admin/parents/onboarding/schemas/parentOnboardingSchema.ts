import { z } from "zod";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import { isValidIanaTimezoneId } from "@/frontend/common/lib/timezone";
import { InvoiceType } from "@/frontend/common/views/dashboard/admin/parents/onboarding/types";
import { validateMeetingProviderFields } from "@/frontend/common/views/dashboard/profile/shared/meetingProviderValidation";
import { onboardingPaymentMethodSchema } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/paymentMethodFormSchema";

export type { ParentOnboardingFormData } from "@/frontend/common/views/dashboard/admin/parents/onboarding/types";

export const parentOnboardingSchema = z
  .object({
    name: z.string().min(1, "fullNameRequired"),
    email: z.email({ message: "emailInvalid" }),
    password: z.string().min(8, "passwordRequired"),
    avatarUrl: z.string().optional(),
    phone: z.string().optional(),
    nationality: z.string().optional(),
    address: z.string().optional(),
    whatsapp: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    invoiceType: z
      .custom<InvoiceType>(val => typeof val === "string" && (Object.values(InvoiceType) as string[]).includes(val), {
        message: "invoiceTypeRequired",
      })
      .optional()
      .nullable(),
    feeAmount: z.string().optional(),
    payinMethod: onboardingPaymentMethodSchema.optional().nullable(),
    currency: z.enum(CurrencyCode).refine(v => !!v, { message: "currencyRequired" }),
    timezone: z
      .string()
      .min(1, "timezoneRequired")
      .refine(value => isValidIanaTimezoneId(value), { message: "timezoneRequired" }),
    displayCurrency: z.enum(CurrencyCode).optional().nullable(),
    meetingProvider: z.custom<MeetingProviderFieldsFragment | null>().nullable().optional(),
    meetingUrl: z.string().optional(),
    meetingLabel: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    validateMeetingProviderFields(data, ctx, {
      meetingProviderRequired: "meetingProviderRequired",
      meetingUrlRequired: "meetingUrlRequired",
      meetingUrlInvalid: "meetingUrlInvalid",
    });
  });
