import { useCallback } from "react";
import { resolveQuickPayAction } from "@/frontend/common/views/dashboard/billing/__shared__/billingViewModelHelpers";
import type { BillingPermissions } from "@/frontend/common/views/dashboard/billing/hooks/useBillingPermissions";
import { useDownloadInvoicePdf } from "@/frontend/common/views/dashboard/billing/hooks/useDownloadInvoicePdf";
import type { MarkPaidInvoiceTarget } from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type {
  BillingData,
  BillingStoreState,
  BillingTranslations,
} from "@/frontend/common/views/dashboard/billing/useParentBillingViewModel.state";

function useQuickPayHandler(
  translations: BillingTranslations,
  permissions: BillingPermissions,
  store: BillingStoreState,
  data: BillingData,
  handlePayNow: (invoice: MarkPaidInvoiceTarget) => void
): () => void {
  const { labels, tErrors, locale, fxMessages, tc } = translations;
  const { billingActionsDisabled } = permissions;
  const { showFeedback } = store;

  return useCallback(() => {
    resolveQuickPayAction({
      billingActionsDisabled,
      summaryLoading: data.summaryLoading,
      summaryData: data.summaryData,
      locale,
      fxMessages,
      labels,
      tErrors,
      tcLoading: tc.loading,
      showFeedback,
      handlePayNow,
    });
  }, [
    billingActionsDisabled,
    handlePayNow,
    labels,
    locale,
    fxMessages,
    showFeedback,
    data.summaryData,
    data.summaryLoading,
    tErrors,
    tc.loading,
  ]);
}

interface BillingActionHandlers {
  handlePayNow: (invoice: MarkPaidInvoiceTarget) => void;
  handleQuickPay: () => void;
  handleDownloadPdf: (invoiceId: string) => void;
  handleMarkAsPaid: (invoice: MarkPaidInvoiceTarget) => void;
}

export function useBillingActionHandlers(
  translations: BillingTranslations,
  permissions: BillingPermissions,
  store: BillingStoreState,
  data: BillingData
): BillingActionHandlers {
  const { labels, tErrors } = translations;
  const { canManage, billingActionsDisabled } = permissions;
  const { setProofTarget, showFeedback } = store;

  const handlePayNow = useCallback(
    (invoice: MarkPaidInvoiceTarget) => {
      if (billingActionsDisabled) {
        showFeedback(tErrors.auth.impersonationNotAllowedDuringSession, "error");
        return;
      }
      setProofTarget(invoice);
    },
    [billingActionsDisabled, setProofTarget, showFeedback, tErrors]
  );

  const handleQuickPay = useQuickPayHandler(translations, permissions, store, data, handlePayNow);

  const handleDownloadPdf = useDownloadInvoicePdf({
    showFeedback,
    popupBlockedLabel: labels.notifications.popupBlocked,
  });

  const handleMarkAsPaid = useCallback(
    (invoice: MarkPaidInvoiceTarget) => {
      if (!canManage) {
        return;
      }
      if (billingActionsDisabled) {
        showFeedback(tErrors.auth.impersonationNotAllowedDuringSession, "error");
        return;
      }
      setProofTarget(invoice);
    },
    [billingActionsDisabled, canManage, setProofTarget, showFeedback, tErrors]
  );

  return { handlePayNow, handleQuickPay, handleDownloadPdf, handleMarkAsPaid };
}
