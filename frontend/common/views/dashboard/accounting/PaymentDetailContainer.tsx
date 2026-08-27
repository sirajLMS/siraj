"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type PaymentDetailViewModel,
  usePaymentDetailViewModel,
} from "@/frontend/common/views/dashboard/accounting/usePaymentDetailViewModel";

const lazyViews = createLazyView<PaymentDetailViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/accounting/PaymentDetailView.mobile").then(m => ({
      default: m.PaymentDetailMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/accounting/PaymentDetailView.desktop").then(m => ({
      default: m.PaymentDetailDesktop,
    }))
);

interface PaymentDetailContainerProps {
  readonly paymentId: string;
}

export function PaymentDetailContainer({ paymentId }: Readonly<PaymentDetailContainerProps>) {
  const viewModel = usePaymentDetailViewModel(paymentId);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
