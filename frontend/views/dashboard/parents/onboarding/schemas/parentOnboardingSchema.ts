import { z } from "zod";
import { InvoiceType, type ParentOnboardingFormData, PaymentMethod } from "../types";

export type { ParentOnboardingFormData };

export const parentOnboardingSchema = z.object({
  name: z.string().min(1, "fullNameRequired"),
  email: z.email({ message: "emailInvalid" }),
  phone: z.string().min(1, "phoneRequired"),
  nationality: z.string().optional(),
  address: z.string().min(1, "addressRequired"),
  whatsapp: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  skype: z.string().optional(),
  defaultZoomLink: z.string().optional(),
  invoiceType: z.custom<InvoiceType>(
    val => typeof val === "string" && Object.values(InvoiceType).includes(val as InvoiceType),
    { message: "invoiceTypeRequired" }
  ),
  feeAmount: z.string().min(1, "feeAmountRequired"),
  paymentMethod: z.custom<PaymentMethod>(
    val => typeof val === "string" && Object.values(PaymentMethod).includes(val as PaymentMethod),
    { message: "paymentMethodRequired" }
  ),
  currency: z.string().min(1, "currencyRequired"),
});
