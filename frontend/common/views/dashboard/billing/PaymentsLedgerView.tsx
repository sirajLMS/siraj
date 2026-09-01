"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type PaymentsLedgerViewModel,
  type UsePaymentsLedgerViewModelProps,
  usePaymentsLedgerViewModel,
} from "@/frontend/common/views/dashboard/billing/usePaymentsLedgerViewModel";

const lazyViews = createLazyView<PaymentsLedgerViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/billing/paymentsLedger.mobile").then(m => ({
      default: m.PaymentsLedgerMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/billing/paymentsLedger.desktop").then(m => ({
      default: m.PaymentsLedgerDesktopView,
    }))
);

export function PaymentsLedgerView(props: Readonly<UsePaymentsLedgerViewModelProps>) {
  const viewModel = usePaymentsLedgerViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
export type { PaymentsLedgerViewModel, UsePaymentsLedgerViewModelProps };
