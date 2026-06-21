// cspell:ignore Financials
import type { BillingManualLabels } from "@/shared/messages/types/dashboard/billing/manual";

type BillingManualTranslator = (key: string) => string;

export function buildManualInvoiceLabels(t: BillingManualTranslator): BillingManualLabels {
  return {
    pageTitle: t("pageTitle"),
    pageSubtitle: t("pageSubtitle"),
    backToFinancials: t("backToFinancials"),
    parentSelection: t("parentSelection"),
    parentPlaceholder: t("parentPlaceholder"),
    feeAmount: t("feeAmount"),
    feeAmountPlaceholder: t("feeAmountPlaceholder"),
    issueDate: t("issueDate"),
    dueDate: t("dueDate"),
    billingMonths: t("billingMonths"),
    billingMonthsMobile: t("billingMonthsMobile"),
    summaryTitle: t("summaryTitle"),
    summarySubtitle: t("summarySubtitle"),
    totalDraftValue: t("totalDraftValue"),
    submit: t("submit"),
    submitAndSendEmail: t("submitAndSendEmail"),
    successMessage: t("successMessage"),
    createSuccess: t("createSuccess"),
    months: {
      jan: t("months.jan"),
      feb: t("months.feb"),
      mar: t("months.mar"),
      apr: t("months.apr"),
      may: t("months.may"),
      jun: t("months.jun"),
      jul: t("months.jul"),
      aug: t("months.aug"),
      sep: t("months.sep"),
      oct: t("months.oct"),
      nov: t("months.nov"),
      dec: t("months.dec"),
    },
    validation: {
      parentRequired: t("validation.parentRequired"),
      feeAmountRequired: t("validation.feeAmountRequired"),
      feeAmountPositive: t("validation.feeAmountPositive"),
      issueDateRequired: t("validation.issueDateRequired"),
      dueDateRequired: t("validation.dueDateRequired"),
      billingMonthsRequired: t("validation.billingMonthsRequired"),
      dueDateBeforeIssueDate: t("validation.dueDateBeforeIssueDate"),
    },
    support: {
      secureBilling: {
        title: t("support.secureBilling.title"),
        body: t("support.secureBilling.body"),
      },
      automatedLedgers: {
        title: t("support.automatedLedgers.title"),
        body: t("support.automatedLedgers.body"),
      },
      draftMode: {
        title: t("support.draftMode.title"),
        body: t("support.draftMode.body"),
      },
    },
  };
}
