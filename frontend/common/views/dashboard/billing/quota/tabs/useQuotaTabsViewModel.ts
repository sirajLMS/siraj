"use client";

import { useMemo } from "react";
import { useQuotaTabsStore } from "@/frontend/common/stores/quotaTabsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { getVisibleQuotaTabs } from "@/frontend/common/views/dashboard/billing/quota/tabs/config/quotaTabs.config";
import type {
  QuotaTabId,
  QuotaTabLabelKey,
  QuotaTabsViewModel,
  QuotaViewLabels,
} from "@/frontend/common/views/dashboard/billing/quota/tabs/types";
import { useTabbedPane } from "@/frontend/common/views/dashboard/lib/useTabbedPane";
import { useAppTranslation } from "@/shared/locale";
import { DashboardBillingQuota } from "@/shared/locale/namespaces";

export type { QuotaTabsViewModel };

export function useQuotaTabsViewModel(): QuotaTabsViewModel {
  const labels = useAppTranslation(DashboardBillingQuota);
  const hasPermission = useUserStore(state => state.hasPermission);
  const markTabVisited = useQuotaTabsStore(state => state.markTabVisited);

  const visibleTabs = useMemo(() => getVisibleQuotaTabs(hasPermission), [hasPermission]);

  const viewLabels: QuotaViewLabels = useMemo(
    () => ({
      title: labels.title,
      tabs: {
        listTitle: labels.listTitle,
        insights: labels.insights,
      },
      tabNavAriaLabel: labels.title,
    }),
    [labels]
  );

  return useTabbedPane<QuotaTabId, QuotaTabLabelKey, QuotaViewLabels>({
    visibleTabs,
    defaultTabId: "allocations",
    markTabVisited,
    viewLabels,
    labelFor: key => viewLabels.tabs[key],
  });
}
