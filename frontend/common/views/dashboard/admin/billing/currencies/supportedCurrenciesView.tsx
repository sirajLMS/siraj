"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { CurrencyOption } from "@/frontend/common/lib/currency";

export interface SupportedCurrenciesViewModel {
  readonly rows: ReadonlyArray<CurrencyOption & { readonly id: string }>;
  readonly emptyMessage: string;
  readonly footerNote: string;
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly flagColumnLabel: string;
  readonly codeColumnLabel: string;
  readonly symbolColumnLabel: string;
  readonly nameColumnLabel: string;
  readonly countryColumnLabel: string;
}

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
