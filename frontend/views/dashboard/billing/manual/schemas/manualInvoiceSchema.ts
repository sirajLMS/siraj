import { z } from "zod";
import type { BillingManualValidationLabels } from "@/shared/messages/types/dashboard/billing/manual";
import { BILLING_MONTH_IDS } from "../constants/billingMonths";

export const manualInvoiceSchema = (labels: BillingManualValidationLabels) =>
  z
    .object({
      parentId: z.string().min(1, labels.parentRequired),
      feeAmount: z
        .string()
        .min(1, labels.feeAmountRequired)
        .refine(value => {
          const parsed = Number(value);
          return !Number.isNaN(parsed) && parsed > 0;
        }, labels.feeAmountPositive),
      issueDate: z.string().min(1, labels.issueDateRequired),
      dueDate: z.string().min(1, labels.dueDateRequired),
      billingMonths: z.array(z.enum(BILLING_MONTH_IDS)).min(1, labels.billingMonthsRequired),
    })
    .refine(data => data.dueDate >= data.issueDate, {
      message: labels.dueDateBeforeIssueDate,
      path: ["dueDate"],
    });

export type ManualInvoiceFormData = z.infer<ReturnType<typeof manualInvoiceSchema>>;
