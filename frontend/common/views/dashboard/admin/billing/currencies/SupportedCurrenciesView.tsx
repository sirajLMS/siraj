"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { SupportedCurrenciesViewModel } from "@/frontend/common/views/dashboard/admin/billing/currencies/useSupportedCurrenciesViewModel";

const lazyViews = createLazyView<SupportedCurrenciesViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/admin/billing/currencies/supportedCurrencies.mobile").then(m => ({
      default: m.SupportedCurrenciesMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/admin/billing/currencies/supportedCurrencies.desktop").then(m => ({
      default: m.SupportedCurrenciesDesktopView,
    }))
);

export function SupportedCurrenciesView(props: Readonly<SupportedCurrenciesViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}

export type { SupportedCurrenciesViewModel };
