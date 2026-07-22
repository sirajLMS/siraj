import { z } from "zod";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { BILLING_MONTH_IDS } from "@/shared/constants/billing-months";
import type { BillingManualValidationLabels } from "@/shared/locale";

export const manualInvoiceSchema = (labels: BillingManualValidationLabels) =>
  z
    .object({
      parentId: z.string().min(1, labels.parentRequired),
      studentId: z.string().optional(),
      feeAmount: z
        .string()
        .min(1, labels.feeAmountRequired)
        .refine(value => {
          const parsed = Number(value);
          return !Number.isNaN(parsed) && parsed > 0;
        }, labels.feeAmountPositive),
      currency: z.enum(CurrencyCode),
      issueDate: z.string().min(1, labels.issueDateRequired),
      dueDate: z.string().min(1, labels.dueDateRequired),
      billingMonths: z.array(z.enum(BILLING_MONTH_IDS)).min(1, labels.billingMonthsRequired),
    })
    .refine(data => data.dueDate >= data.issueDate, {
      message: labels.dueDateBeforeIssueDate,
      path: ["dueDate"],
    });

export type ManualInvoiceFormData = {
  parentId: string;
  studentId?: string;
  feeAmount: string;
  currency: CurrencyCode;
  issueDate: string;
  dueDate: string;
  billingMonths: Array<(typeof BILLING_MONTH_IDS)[number]>;
};
