"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { usePaymentCatalogsTabsStore } from "@/frontend/common/stores/paymentCatalogsTabsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { getVisiblePaymentCatalogsTabs } from "@/frontend/common/views/dashboard/admin/payment-catalogs/tabs/config/paymentCatalogsTabs.config";
import type {
  PaymentCatalogsTabId,
  PaymentCatalogsTabLabelKey,
  PaymentCatalogsTabsViewModel,
  PaymentCatalogsViewLabels,
} from "@/frontend/common/views/dashboard/admin/payment-catalogs/tabs/types";
import { buildTabHref, buildTabNavItems, resolveTab } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import { Translation, useAppTranslation } from "@/shared/locale";

export type { PaymentCatalogsTabsViewModel };

export function usePaymentCatalogsTabsViewModel(): PaymentCatalogsTabsViewModel {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const labels = useAppTranslation(Translation.Dashboard.PaymentCatalogsParent);
  const hasPermission = useUserStore(state => state.hasPermission);
  const markTabVisited = usePaymentCatalogsTabsStore(state => state.markTabVisited);

  const visibleTabs = useMemo(() => getVisiblePaymentCatalogsTabs(hasPermission), [hasPermission]);
  const tabParam = searchParams.get("tab");
  const resolvedActiveTab =
    resolveTab<PaymentCatalogsTabId, PaymentCatalogsTabLabelKey>(tabParam, visibleTabs) ?? "paymentCatalogs";

  useEffect(() => {
    markTabVisited(resolvedActiveTab);
  }, [markTabVisited, resolvedActiveTab]);

  useEffect(() => {
    if (!resolvedActiveTab || tabParam === resolvedActiveTab) {
      return;
    }
    router.replace(buildTabHref(pathname, searchParams, resolvedActiveTab), { scroll: false });
  }, [resolvedActiveTab, tabParam, pathname, router, searchParams]);

  const viewLabels: PaymentCatalogsViewLabels = useMemo(
    () => ({
      title: labels.pageTitle,
      subtitle: labels.pageSubtitle,
      tabs: labels.tabs,
    }),
    [labels]
  );

  const tabNavItems = useMemo(
    () =>
      buildTabNavItems<PaymentCatalogsTabId, PaymentCatalogsTabLabelKey, PaymentCatalogsViewLabels>({
        labels: viewLabels,
        visibleTabs,
        activeTab: resolvedActiveTab,
        pathname,
        searchParams,
        labelFor: key => labels.tabs[key],
      }),
    [visibleTabs, labels.tabs, viewLabels, resolvedActiveTab, pathname, searchParams]
  );

  return { labels: viewLabels, activeTab: resolvedActiveTab, tabNavItems };
}
