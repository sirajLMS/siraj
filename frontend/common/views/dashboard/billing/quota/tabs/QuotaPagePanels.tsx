"use client";

import { useQuotaTabsStore } from "@/frontend/common/stores/quotaTabsStore";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import {
  LazyQuotaAllocationsTab,
  LazyQuotaInsightsTab,
} from "@/frontend/common/views/dashboard/billing/quota/tabs/QuotaPagePanels.lazy";
import type { QuotaTabId } from "@/frontend/common/views/dashboard/billing/quota/tabs/types";
import { createTabbedPanePanels } from "@/frontend/common/views/dashboard/lib/createTabbedPanePanels";

export const QuotaPagePanels = createTabbedPanePanels<QuotaTabId>({
  useVisitedTabs: () => useQuotaTabsStore(state => state.visitedTabs),
  ariaIdPrefix: "quota",
  panels: [
    { id: "allocations", permissions: PAGE_PERMISSIONS.quotas, Component: LazyQuotaAllocationsTab },
    { id: "insights", permissions: PAGE_PERMISSIONS.quotas, Component: LazyQuotaInsightsTab },
  ],
});
