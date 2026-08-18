"use client";

import { useMemo } from "react";
import { useBillingTabsStore } from "@/frontend/common/stores/billingTabsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { getVisibleBillingTabs } from "@/frontend/common/views/dashboard/billing/tabs/config/billingTabs.config";
import type {
  BillingTabId,
  BillingTabLabelKey,
  BillingTabsViewModel,
  BillingViewLabels,
} from "@/frontend/common/views/dashboard/billing/tabs/types";
import { useTabbedPane } from "@/frontend/common/views/dashboard/lib/useTabbedPane";
import { Translation, useAppTranslation } from "@/shared/locale";

export type { BillingTabsViewModel };

export function useBillingTabsViewModel(): BillingTabsViewModel {
  const labels = useAppTranslation(Translation.Dashboard.Billing);
  const hasPermission = useUserStore(state => state.hasPermission);
  const markTabVisited = useBillingTabsStore(state => state.markTabVisited);

  const visibleTabs = useMemo(() => getVisibleBillingTabs(hasPermission), [hasPermission]);

  const viewLabels: BillingViewLabels = useMemo(
    () => ({
      title: labels.tabsPageTitle,
      subtitle: labels.tabsPageSubtitle,
      tabs: {
        overview: labels.billingTabs.overview,
        invoices: labels.billingTabs.invoices,
        exchangeRates: labels.billingTabs.exchangeRates,
        currencies: labels.billingTabs.currencies,
        hedges: labels.billingTabs.hedges,
        manual: labels.billingTabs.manual,
      },
      tabNavAriaLabel: labels.tabNavAriaLabel,
    }),
    [labels]
  );

  return useTabbedPane<BillingTabId, BillingTabLabelKey, BillingViewLabels>({
    visibleTabs,
    defaultTabId: "overview",
    markTabVisited,
    viewLabels,
    labelFor: key => labels.billingTabs[key],
  });
}
