import { lazy } from "react";

export const LazyQuotaAllocationsTab = lazy(() =>
  import("@/frontend/common/views/dashboard/billing/quota/QuotaContainer").then(m => ({
    default: m.QuotaContainer,
  }))
);

export const LazyQuotaInsightsTab = lazy(() =>
  import("@/frontend/common/views/dashboard/billing/quota/QuotaInsightsContainer").then(m => ({
    default: m.QuotaInsightsContainer,
  }))
);
