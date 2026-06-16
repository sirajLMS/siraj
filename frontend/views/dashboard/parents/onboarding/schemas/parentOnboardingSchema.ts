import { z } from "zod";

export const parentOnboardingSchema = z.object({
  fullName: z.string().min(1, "fullNameRequired"),
  email: z.email({ message: "emailInvalid" }),
  phone: z.string().min(1, "phoneRequired"),
  nationality: z.string().optional(),
  address: z.string().min(1, "addressRequired"),
  whatsapp: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  skype: z.string().optional(),
  zoomId: z.string().optional(),
  invoiceType: z
    .string()
    .min(1, "invoiceTypeRequired")
    .refine(val => ["per_class", "monthly", "semester"].includes(val), {
      message: "invoiceTypeRequired",
    }),
  feeAmount: z.string().min(1, "feeAmountRequired"),
  paymentMethod: z
    .string()
    .min(1, "paymentMethodRequired")
    .refine(val => ["bank_transfer", "credit_card", "cash", "paypal"].includes(val), {
      message: "paymentMethodRequired",
    }),
  currency: z.string().min(1, "currencyRequired"),
});

export type ParentOnboardingFormData = z.infer<typeof parentOnboardingSchema>;
