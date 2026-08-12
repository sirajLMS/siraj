import { lazy } from "react";

export const LazyOverviewTab = lazy(() =>
  import("@/frontend/common/views/dashboard/billing/tabs/overview/OverviewTab").then(m => ({
    default: m.OverviewTab,
  }))
);

export const LazyInvoicesTab = lazy(() =>
  import("@/frontend/common/views/dashboard/billing/tabs/invoices/InvoicesTab").then(m => ({
    default: m.InvoicesTab,
  }))
);

export const LazyExchangeRatesTab = lazy(() =>
  import("@/frontend/common/views/dashboard/admin/billing/exchange-rates/ExchangeRatesContainer").then(m => ({
    default: m.ExchangeRatesContainer,
  }))
);

export const LazyCurrenciesTab = lazy(() =>
  import("@/frontend/common/views/dashboard/admin/billing/currencies/SupportedCurrenciesContainer").then(m => ({
    default: m.SupportedCurrenciesContainer,
  }))
);

export const LazyHedgesTab = lazy(() =>
  import("@/frontend/common/views/dashboard/admin/billing/currency-hedges/CurrencyHedgesContainer").then(m => ({
    default: m.CurrencyHedgesContainer,
  }))
);

export const LazyManualTab = lazy(() =>
  import("@/frontend/common/views/dashboard/billing/manual/ManualInvoiceContainer").then(m => ({
    default: m.ManualInvoiceContainer,
  }))
);
