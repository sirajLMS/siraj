"use client";

import { createLazyView } from "@/frontend/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/components/ui/container/ResponsiveViewSwitch";
import {
  type ParentBillingViewModel,
  type UseParentBillingViewModelProps,
  useParentBillingViewModel,
} from "@/frontend/views/dashboard/billing/useParentBillingViewModel";

export type { ParentBillingViewModel };

const lazyViews = createLazyView<ParentBillingViewModel>(
  () =>
    import("@/frontend/views/dashboard/billing/mobile/parentBilling.mobile").then(m => ({
      default: m.ParentBillingMobileView,
    })),
  () =>
    import("@/frontend/views/dashboard/billing/desktop/parentBilling.desktop").then(m => ({
      default: m.ParentBillingDesktopView,
    }))
);

export function ParentBillingView(props: Readonly<UseParentBillingViewModelProps>) {
  const viewModel = useParentBillingViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
