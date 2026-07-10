import { z } from "zod";
import { CurrencyCode, InvoiceType } from "@/frontend/graphql/generated/gql/graphql-types";

export const parentProfileEditSchema = z.object({
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
  currency: z.enum(CurrencyCode).refine(v => !!v, { message: "currencyRequired" }),
});

export type ParentProfileEditFormData = z.infer<typeof parentProfileEditSchema>;
