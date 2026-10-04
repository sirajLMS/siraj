"use client";

import { buildManualInvoiceLabels } from "@/frontend/common/views/dashboard/billing/manual/utils/buildManualInvoiceLabels";
import { buildFxAndCurrencyLabels } from "@/frontend/common/views/dashboard/billing/utils/__shared__/buildBillingLabels.fx";
import {
  buildMetricLabels,
  buildNotificationAndErrorLabels,
  buildPageLabels,
  buildSectionAndSearchLabels,
  buildStatusLabels,
  buildSuccessLabels,
} from "@/frontend/common/views/dashboard/billing/utils/__shared__/buildBillingLabels.page";
import {
  buildPaymentDetailsDialogLabels,
  buildPaymentLabels,
  buildSubmitProofDialogLabels,
  buildTableLabels,
} from "@/frontend/common/views/dashboard/billing/utils/__shared__/buildBillingLabels.tables";
import type { BillingLabels } from "@/shared/locale";

export function buildBillingLabels(t: BillingLabels): BillingLabels {
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
    displayCurrencyNotSet: t.displayCurrencyNotSet,
    displayCurrencyStale: t.displayCurrencyStale,
    manual: buildManualInvoiceLabels(t.manual),
    tabsPageTitle: t.tabsPageTitle,
    tabsPageSubtitle: t.tabsPageSubtitle,
    tabNavAriaLabel: t.tabNavAriaLabel,
    billingTabs: t.billingTabs,
    paymentsLedger: t.paymentsLedger,
  };
}
