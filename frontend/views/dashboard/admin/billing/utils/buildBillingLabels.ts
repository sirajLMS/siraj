import {
  type BillingTranslator,
  buildFxAndCurrencyLabels,
  buildManualInvoiceLabels,
  buildMetricLabels,
  buildNotificationAndErrorLabels,
  buildPageLabels,
  buildPaymentDetailsDialogLabels,
  buildPaymentLabels,
  buildSectionAndSearchLabels,
  buildStatusLabels,
  buildSubmitProofDialogLabels,
  buildSuccessLabels,
  buildTableLabels,
} from "@/frontend/views/dashboard/billing/utils/__shared__/buildBillingLabels";
import type { BillingLabels } from "@/shared/messages/types/dashboard/billing";

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
