"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useBillingTabsStore } from "@/frontend/common/stores/billingTabsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { getVisibleBillingTabs } from "@/frontend/common/views/dashboard/billing/tabs/config/billingTabs.config";
import type {
  BillingTabId,
  BillingTabLabelKey,
  BillingTabsViewModel,
  BillingViewLabels,
} from "@/frontend/common/views/dashboard/billing/tabs/types";
import { buildTabHref, buildTabNavItems, resolveTab } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import { Translation, useAppTranslation } from "@/shared/locale";

export type { BillingTabsViewModel };

export function useBillingTabsViewModel(): BillingTabsViewModel {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const labels = useAppTranslation(Translation.Dashboard.Billing);
  const hasPermission = useUserStore(state => state.hasPermission);
  const markTabVisited = useBillingTabsStore(state => state.markTabVisited);

  const visibleTabs = useMemo(() => getVisibleBillingTabs(hasPermission), [hasPermission]);
  const tabParam = searchParams.get("tab");
  const resolvedActiveTab = resolveTab<BillingTabId, BillingTabLabelKey>(tabParam, visibleTabs) ?? "overview";

  useEffect(() => {
    markTabVisited(resolvedActiveTab);
  }, [markTabVisited, resolvedActiveTab]);

  useEffect(() => {
    if (!resolvedActiveTab || tabParam === resolvedActiveTab) {
      return;
    }
    router.replace(buildTabHref(pathname, searchParams, resolvedActiveTab), { scroll: false });
  }, [resolvedActiveTab, tabParam, pathname, router, searchParams]);

  const tabNavItems = useMemo(
    () =>
      buildTabNavItems<BillingTabId, BillingTabLabelKey, BillingViewLabels>({
        labels: {
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
        },
        visibleTabs,
        activeTab: resolvedActiveTab,
        pathname,
        searchParams,
        labelFor: key => labels.billingTabs[key],
      }),
    [
      visibleTabs,
      labels.billingTabs,
      labels.tabsPageTitle,
      labels.tabsPageSubtitle,
      resolvedActiveTab,
      pathname,
      searchParams,
    ]
  );

  return {
    labels: {
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
    },
    activeTab: resolvedActiveTab,
    tabNavItems,
  };
}
