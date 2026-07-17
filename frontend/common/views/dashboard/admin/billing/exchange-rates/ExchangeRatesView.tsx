"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { ExchangeRatesViewModel } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/useExchangeRatesViewModel";

const lazyViews = createLazyView<ExchangeRatesViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/admin/billing/exchange-rates/exchangeRates.mobile").then(m => ({
      default: m.ExchangeRatesMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/admin/billing/exchange-rates/exchangeRates.desktop").then(m => ({
      default: m.ExchangeRatesDesktopView,
    }))
);

export function ExchangeRatesView(props: Readonly<ExchangeRatesViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}

export type { ExchangeRatesViewModel };
