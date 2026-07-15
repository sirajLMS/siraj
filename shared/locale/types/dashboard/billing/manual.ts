import type { BillingMonthId } from "@/shared/constants/billing-months";

export interface BillingManualValidationLabels {
  readonly parentRequired: string;
  readonly feeAmountRequired: string;
  readonly feeAmountPositive: string;
  readonly issueDateRequired: string;
  readonly dueDateRequired: string;
  readonly billingMonthsRequired: string;
  readonly dueDateBeforeIssueDate: string;
}

export interface BillingManualSupportCardLabels {
  readonly title: string;
  readonly body: string;
}

export interface BillingManualLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly backToFinancials: string;
  readonly parentSelection: string;
  readonly parentPlaceholder: string;
  readonly studentSelection: string;
  readonly feeAmount: string;
  readonly feeAmountPlaceholder: string;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly billingMonths: string;
  readonly billingMonthsMobile: string;
  readonly summaryTitle: string;
  readonly summarySubtitle: string;
  readonly totalDraftValue: string;
  readonly submit: string;
  readonly submitAndSendEmail: string;
  readonly successMessage: string;
  readonly createSuccess: (id: string) => string;
  readonly manualInvoiceFxNote: string;
  readonly months: Record<BillingMonthId, string>;
  readonly validation: BillingManualValidationLabels;
  readonly support: {
    readonly secureBilling: BillingManualSupportCardLabels;
    readonly automatedLedgers: BillingManualSupportCardLabels;
    readonly draftMode: BillingManualSupportCardLabels;
  };
}
