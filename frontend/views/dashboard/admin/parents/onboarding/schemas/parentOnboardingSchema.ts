import { z } from "zod";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import { isValidIanaTimezoneId } from "@/frontend/common/lib/timezone";
import { InvoiceType } from "@/frontend/views/dashboard/admin/parents/onboarding/types";
import { onboardingPaymentMethodSchema } from "@/frontend/views/dashboard/profile/shared/payment-methods/paymentMethodFormSchema";

export type { ParentOnboardingFormData } from "@/frontend/views/dashboard/admin/parents/onboarding/types";

export const parentOnboardingSchema = z
  .object({
    name: z.string().min(1, "fullNameRequired"),
    email: z.email({ message: "emailInvalid" }),
    phone: z.string().min(1, "phoneRequired"),
    nationality: z.string().optional(),
    address: z.string().min(1, "addressRequired"),
    whatsapp: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    invoiceType: z.custom<InvoiceType>(
      val => typeof val === "string" && (Object.values(InvoiceType) as string[]).includes(val),
      { message: "invoiceTypeRequired" }
    ),
    feeAmount: z.string().min(1, "feeAmountRequired"),
    payinMethod: onboardingPaymentMethodSchema,
    currency: z.enum(CurrencyCode).refine(v => !!v, { message: "currencyRequired" }),
    timezone: z
      .string()
      .min(1, "timezoneRequired")
      .refine(value => isValidIanaTimezoneId(value), { message: "timezoneRequired" }),
    meetingProvider: z.custom<MeetingProviderFieldsFragment | null>().nullable().optional(),
    meetingUrl: z.string().optional(),
    meetingLabel: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasUrl = Boolean(data.meetingUrl?.trim());
    const hasProvider = Boolean(data.meetingProvider?.id);
    if (hasUrl && !hasProvider) {
      ctx.addIssue({ code: "custom", message: "meetingProviderRequired", path: ["meetingProvider"] });
    }
    if (hasProvider && !hasUrl) {
      ctx.addIssue({ code: "custom", message: "meetingUrlRequired", path: ["meetingUrl"] });
    }
    if (hasUrl && data.meetingUrl) {
      try {
        new URL(data.meetingUrl);
      } catch {
        ctx.addIssue({ code: "custom", message: "meetingUrlInvalid", path: ["meetingUrl"] });
      }
    }
  });
