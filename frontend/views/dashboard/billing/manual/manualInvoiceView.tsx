"use client";

import { FormSuccessSnackbar } from "@/frontend/common/components/ui";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ManualInvoiceViewModel,
  type UseManualInvoiceViewModelProps,
  useManualInvoiceViewModel,
} from "@/frontend/views/dashboard/billing/manual/useManualInvoiceViewModel";

export type { ManualInvoiceViewModel };

const lazyViews = createLazyView<ManualInvoiceViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/billing/manual/manualInvoice.mobile").then(m => ({
      default: m.ManualInvoiceMobileView,
    })),
  () =>
    import("@/frontend/views/dashboard/billing/manual/desktop/manualInvoice.desktop").then(m => ({
      default: m.ManualInvoiceDesktopView,
    }))
);

export function ManualInvoiceView(props: Readonly<UseManualInvoiceViewModelProps>) {
  const viewModel = useManualInvoiceViewModel(props);

  return (
    <>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
      <FormSuccessSnackbar
        open={viewModel.showSuccess}
        message={viewModel.labels.successMessage}
        onClose={viewModel.onDismissSuccess}
      />
    </>
  );
}
