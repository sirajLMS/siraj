"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { usePaymentsListViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentsListViewModel";

const lazyViews = createLazyView<ReturnType<typeof usePaymentsListViewModel>>(
  () =>
    import("@/frontend/desktop/views/dashboard/accounting/PaymentsListView.desktop").then(m => ({
      default: m.PaymentsListDesktop,
    })),
  () =>
    import("@/frontend/mobile/views/dashboard/accounting/PaymentsListView.mobile").then(m => ({
      default: m.PaymentsListMobile,
    }))
);

export function PaymentsContainer() {
  const viewModel = usePaymentsListViewModel();
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
