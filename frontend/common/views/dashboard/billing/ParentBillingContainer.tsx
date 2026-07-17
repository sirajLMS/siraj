"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ParentBillingViewModel,
  type UseParentBillingViewModelProps,
  useParentBillingViewModel,
} from "@/frontend/common/views/dashboard/billing/useParentBillingViewModel";

const lazyViews = createLazyView<ParentBillingViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/billing/parentBilling.mobile").then(m => ({
      default: m.ParentBillingMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/billing/parentBilling.desktop").then(m => ({
      default: m.ParentBillingDesktopView,
    }))
);

export function ParentBillingView(props: Readonly<UseParentBillingViewModelProps>) {
  const viewModel = useParentBillingViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

export type { ParentBillingViewModel, UseParentBillingViewModelProps };
