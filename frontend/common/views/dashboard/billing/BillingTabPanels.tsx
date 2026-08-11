"use client";

import { useBillingTabsStore } from "@/frontend/common/stores/billingTabsStore";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import {
  LazyCurrenciesTab,
  LazyExchangeRatesTab,
  LazyHedgesTab,
  LazyInvoicesTab,
  LazyManualTab,
  LazyOverviewTab,
} from "@/frontend/common/views/dashboard/billing/BillingTabPanels.lazy";
import type { BillingTabId } from "@/frontend/common/views/dashboard/billing/tabs/types";
import { createTabbedPanePanels } from "@/frontend/common/views/dashboard/lib/createTabbedPanePanels";

export const BillingTabPanels = createTabbedPanePanels<BillingTabId>({
  useVisitedTabs: () => useBillingTabsStore(state => state.visitedTabs),
  ariaIdPrefix: "billing",
  panels: [
    { id: "overview", permissions: PAGE_PERMISSIONS.billingOverview, Component: LazyOverviewTab },
    { id: "invoices", permissions: PAGE_PERMISSIONS.billingInvoices, Component: LazyInvoicesTab },
    { id: "exchangeRates", permissions: PAGE_PERMISSIONS.billingExchangeRates, Component: LazyExchangeRatesTab },
    { id: "currencies", permissions: PAGE_PERMISSIONS.billingCurrencies, Component: LazyCurrenciesTab },
    { id: "hedges", permissions: PAGE_PERMISSIONS.billingHedges, Component: LazyHedgesTab },
    { id: "manual", permissions: PAGE_PERMISSIONS.billingManual, Component: LazyManualTab },
  ],
});
