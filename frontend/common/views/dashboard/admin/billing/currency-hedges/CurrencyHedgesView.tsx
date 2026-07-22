"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { CurrencyHedgesViewModel } from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/useCurrencyHedgesViewModel";

const lazyViews = createLazyView<CurrencyHedgesViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/admin/billing/currency-hedges/currencyHedges.mobile").then(m => ({
      default: m.CurrencyHedgesMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/admin/billing/currency-hedges/currencyHedges.desktop").then(m => ({
      default: m.CurrencyHedgesDesktopView,
    }))
);

export function CurrencyHedgesView(props: Readonly<CurrencyHedgesViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
