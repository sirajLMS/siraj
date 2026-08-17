"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type QuotaInsightsViewModel,
  useQuotaInsightsViewModel,
} from "@/frontend/common/views/dashboard/billing/quota/useQuotaInsightsViewModel";

const lazyViews = createLazyView<QuotaInsightsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/billing/quota/quotaInsights.mobile").then(m => ({
      default: m.QuotaInsightsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/billing/quota/quotaInsights.desktop").then(m => ({
      default: m.QuotaInsightsDesktopView,
    }))
);

export function QuotaInsightsContainer() {
  const viewModel = useQuotaInsightsViewModel();
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
