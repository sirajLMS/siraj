"use client";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ManualInvoiceViewModel,
  type UseManualInvoiceViewModelProps,
  useManualInvoiceViewModel,
} from "@/frontend/common/views/dashboard/billing/manual/useManualInvoiceViewModel";

const lazyViews = createLazyView<ManualInvoiceViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/billing/manual/manualInvoice.mobile").then(m => ({
      default: m.ManualInvoiceMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/billing/manual/manualInvoice.desktop").then(m => ({
      default: m.ManualInvoiceDesktopView,
    }))
);

export function ManualInvoiceView(props: Readonly<UseManualInvoiceViewModelProps>) {
  const viewModel = useManualInvoiceViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
export type { ManualInvoiceViewModel, UseManualInvoiceViewModelProps };
