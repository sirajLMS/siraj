"use client";

import { Box, CircularProgress } from "@mui/material";
import { type ComponentType, lazy, Suspense } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { useBillingTabsStore } from "@/frontend/common/stores/billingTabsStore";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import type { BillingTabId } from "@/frontend/common/views/dashboard/billing/tabs/types";

type BillingTabPanelsProps = {
  readonly activeTab: BillingTabId;
};

type TabPanelDefinition = {
  readonly id: BillingTabId;
  readonly permissions: (typeof PAGE_PERMISSIONS)[keyof typeof PAGE_PERMISSIONS];
  readonly Component: ComponentType;
};

const LazyOverviewTab = lazy(() =>
  import("@/frontend/common/views/dashboard/billing/tabs/overview/OverviewTab").then(m => ({
    default: m.OverviewTab,
  }))
);

const LazyInvoicesTab = lazy(() =>
  import("@/frontend/common/views/dashboard/billing/tabs/invoices/InvoicesTab").then(m => ({
    default: m.InvoicesTab,
  }))
);

const LazyExchangeRatesTab = lazy(() =>
  import("@/frontend/common/views/dashboard/admin/billing/exchange-rates/ExchangeRatesContainer").then(m => ({
    default: m.ExchangeRatesContainer,
  }))
);

const LazyCurrenciesTab = lazy(() =>
  import("@/frontend/common/views/dashboard/admin/billing/currencies/SupportedCurrenciesContainer").then(m => ({
    default: m.SupportedCurrenciesContainer,
  }))
);

const LazyHedgesTab = lazy(() =>
  import("@/frontend/common/views/dashboard/admin/billing/currency-hedges/CurrencyHedgesContainer").then(m => ({
    default: m.CurrencyHedgesContainer,
  }))
);

const LazyManualTab = lazy(() =>
  import("@/frontend/common/views/dashboard/billing/manual/ManualInvoiceContainer").then(m => ({
    default: m.ManualInvoiceContainer,
  }))
);

const TAB_PANELS: readonly TabPanelDefinition[] = [
  { id: "overview", permissions: PAGE_PERMISSIONS.billingOverview, Component: LazyOverviewTab },
  { id: "invoices", permissions: PAGE_PERMISSIONS.billingInvoices, Component: LazyInvoicesTab },
  { id: "exchangeRates", permissions: PAGE_PERMISSIONS.billingExchangeRates, Component: LazyExchangeRatesTab },
  { id: "currencies", permissions: PAGE_PERMISSIONS.billingCurrencies, Component: LazyCurrenciesTab },
  { id: "hedges", permissions: PAGE_PERMISSIONS.billingHedges, Component: LazyHedgesTab },
  { id: "manual", permissions: PAGE_PERMISSIONS.billingManual, Component: LazyManualTab },
];

function TabPanelFallback() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
      <CircularProgress size={28} />
    </Box>
  );
}

function getTabPanelSx(isActive: boolean) {
  if (isActive) {
    return {
      position: "relative" as const,
      width: "100%",
      visibility: "visible" as const,
      overflow: "visible" as const,
      pointerEvents: "auto" as const,
    };
  }

  return {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    visibility: "hidden" as const,
    height: 0,
    overflow: "hidden" as const,
    pointerEvents: "none" as const,
  };
}

export function BillingTabPanels({ activeTab }: Readonly<BillingTabPanelsProps>) {
  const visitedTabs = useBillingTabsStore(state => state.visitedTabs);

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      {TAB_PANELS.map(({ id, permissions, Component }) => {
        if (!visitedTabs[id]) {
          return null;
        }

        const isActive = activeTab === id;

        return (
          <Box
            key={id}
            role="tabpanel"
            id={`billing-tabpanel-${id}`}
            aria-labelledby={`billing-tab-${id}`}
            aria-hidden={!isActive}
            sx={getTabPanelSx(isActive)}
          >
            <RequirePermission permissions={permissions} fallback={null}>
              <Suspense fallback={<TabPanelFallback />}>
                <Component />
              </Suspense>
            </RequirePermission>
          </Box>
        );
      })}
    </Box>
  );
}
