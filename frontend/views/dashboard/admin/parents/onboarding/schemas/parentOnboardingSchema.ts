import { z } from "zod";
import { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { isValidIanaTimezoneId } from "@/frontend/lib/timezone";
import { InvoiceType, PaymentMethod } from "@/frontend/views/dashboard/admin/parents/onboarding/types";

export type { ParentOnboardingFormData } from "@/frontend/views/dashboard/admin/parents/onboarding/types";

export const parentOnboardingSchema = z.object({
  name: z.string().min(1, "fullNameRequired"),
  email: z.email({ message: "emailInvalid" }),
  phone: z.string().min(1, "phoneRequired"),
  nationality: z.string().optional(),
  address: z.string().min(1, "addressRequired"),
  whatsapp: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  invoiceType: z.custom<InvoiceType>(
    val => typeof val === "string" && Object.values(InvoiceType).includes(val as InvoiceType),
    { message: "invoiceTypeRequired" }
  ),
  feeAmount: z.string().min(1, "feeAmountRequired"),
  paymentMethod: z.custom<PaymentMethod>(
    val => typeof val === "string" && Object.values(PaymentMethod).includes(val as PaymentMethod),
    { message: "paymentMethodRequired" }
  ),
  currency: z.enum(CurrencyCode).refine(v => !!v, { message: "currencyRequired" }),
  timezone: z
    .string()
    .min(1, "timezoneRequired")
    .refine(value => isValidIanaTimezoneId(value), { message: "timezoneRequired" }),
});
