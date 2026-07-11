import { buildManualInvoiceLabels } from "@/frontend/views/dashboard/billing/manual/utils/buildManualInvoiceLabels";
import {
  type BillingTranslator,
  buildFxAndCurrencyLabels,
  buildMetricLabels,
  buildNotificationAndErrorLabels,
  buildPageLabels,
  buildPaymentDetailsDialogLabels,
  buildPaymentLabels,
  buildSectionAndSearchLabels,
  buildStatusLabels,
  buildSubmitProofDialogLabels,
  buildTableLabels,
} from "@/frontend/views/dashboard/billing/utils/__shared__/buildBillingLabels";
import type { BillingLabels } from "@/shared/messages/types/dashboard/billing";

function buildSuccessLabels(t: BillingTranslator) {
  return {
    markAsPaidSuccess: t("markAsPaidSuccess"),
    submitProofSuccess: t("submitProofSuccess"),
    approveProofSuccess: t("approveProofSuccess"),
    rejectProofSuccess: t("rejectProofSuccess"),
    noUnpaidInvoices: t("noUnpaidInvoices"),
    deleteInvoiceSuccess: t("deleteInvoiceSuccess"),
    deleteInvoiceDialog: {
      title: t("deleteInvoiceDialog.title"),
      body: t.raw("deleteInvoiceDialog.body") as string,
      confirm: t("deleteInvoiceDialog.confirm"),
    },
    reminderSent: t("reminderSent"),
    reminderFailed: t("reminderFailed"),
    hasPaymentProofHint: t("hasPaymentProofHint"),
  };
}

export function buildBillingLabels(t: BillingTranslator): BillingLabels {
  return {
    ...buildPageLabels(t),
    ...buildMetricLabels(t),
    ...buildSectionAndSearchLabels(t),
    ...buildTableLabels(t),
    ...buildStatusLabels(t),
    ...buildPaymentLabels(t),
    ...buildSuccessLabels(t),
    ...buildSubmitProofDialogLabels(t),
    ...buildPaymentDetailsDialogLabels(t),
    ...buildNotificationAndErrorLabels(t),
    ...buildFxAndCurrencyLabels(t),
    manual: buildManualInvoiceLabels((key: string) => {
      if (key === "createSuccess") return t.raw(`manual.${key}`) as string;
      return t(`manual.${key}`);
    }),
  };
}
