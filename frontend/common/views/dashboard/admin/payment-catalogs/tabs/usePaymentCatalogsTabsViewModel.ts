"use client";

import { useMemo } from "react";
import { usePaymentCatalogsTabsStore } from "@/frontend/common/stores/paymentCatalogsTabsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { getVisiblePaymentCatalogsTabs } from "@/frontend/common/views/dashboard/admin/payment-catalogs/tabs/config/paymentCatalogsTabs.config";
import type {
  PaymentCatalogsTabId,
  PaymentCatalogsTabLabelKey,
  PaymentCatalogsTabsViewModel,
  PaymentCatalogsViewLabels,
} from "@/frontend/common/views/dashboard/admin/payment-catalogs/tabs/types";
import { useTabbedPane } from "@/frontend/common/views/dashboard/lib/useTabbedPane";
import { Translation, useAppTranslation } from "@/shared/locale";

export type { PaymentCatalogsTabsViewModel };

export function usePaymentCatalogsTabsViewModel(): PaymentCatalogsTabsViewModel {
  const labels = useAppTranslation(Translation.Dashboard.PaymentCatalogsParent);
  const hasPermission = useUserStore(state => state.hasPermission);
  const markTabVisited = usePaymentCatalogsTabsStore(state => state.markTabVisited);

  const visibleTabs = useMemo(() => getVisiblePaymentCatalogsTabs(hasPermission), [hasPermission]);

  const viewLabels: PaymentCatalogsViewLabels = useMemo(
    () => ({
      title: labels.pageTitle,
      subtitle: labels.pageSubtitle,
      tabs: labels.tabs,
      tabNavAriaLabel: labels.tabNavAriaLabel,
    }),
    [labels]
  );

  return useTabbedPane<PaymentCatalogsTabId, PaymentCatalogsTabLabelKey, PaymentCatalogsViewLabels>({
    visibleTabs,
    defaultTabId: "paymentCatalogs",
    markTabVisited,
    viewLabels,
    labelFor: key => labels.tabs[key],
  });
}
