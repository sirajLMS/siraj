import { z } from "zod";
import { CurrencyCode, PaymentGateway } from "@/frontend/common/graphql/generated/gql/graphql";
import type { PaymentsLabels } from "@/shared/locale/types/dashboard/accounting/payments";

/**
 * Add-Payment form schema (create path). Mirrors AccountingPaymentInput:
 * student + optional package snapshot (hours/amount/currency) + gateway +
 * payment date + paid flag + note. Package snapshot fields auto-fill from
 * the selected plan but stay editable (override path).
 */
export const createPaymentFormSchema = (messages: PaymentsLabels) =>
  z.object({
    studentId: z.string().min(1, messages.form.student),
    packagePlanId: z.string().nullable(),
    creditHours: z.coerce.number().positive(messages.form.credit),
    amount: z.coerce.number().min(0, messages.form.paid),
    currency: z.enum(CurrencyCode),
    paymentGateway: z.enum(PaymentGateway),
    paymentDate: z.string().min(1, messages.form.paymentDate),
    isPaidStatusOn: z.boolean(),
    paymentNote: z.string().nullable(),
  });

/**
 * Edit path schema — mirrors AccountingPaymentEditInput: after creation the
 * student/package/amount/date snapshot is immutable (invoice integrity);
 * only hours, gateway and note may change (invoice-version checked).
 */
export const createPaymentEditSchema = (messages: PaymentsLabels) =>
  z.object({
    creditHours: z.coerce.number().positive(messages.form.credit),
    paymentGateway: z.enum(PaymentGateway),
    paymentNote: z.string().nullable(),
  });

export type PaymentFormData = z.infer<ReturnType<typeof createPaymentFormSchema>>;
export type PaymentFormInput = z.input<ReturnType<typeof createPaymentFormSchema>>;
export type PaymentEditFormData = z.infer<ReturnType<typeof createPaymentEditSchema>>;
export type PaymentEditFormInput = z.input<ReturnType<typeof createPaymentEditSchema>>;
