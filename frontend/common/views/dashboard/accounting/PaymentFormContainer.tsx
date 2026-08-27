"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { usePaymentFormViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentFormViewModel";

const lazyViews = createLazyView<ReturnType<typeof usePaymentFormViewModel>>(
  () =>
    import("@/frontend/desktop/views/dashboard/accounting/PaymentFormView.desktop").then(m => ({
      default: m.PaymentFormDesktop,
    })),
  () =>
    import("@/frontend/mobile/views/dashboard/accounting/PaymentFormView.mobile").then(m => ({
      default: m.PaymentFormMobile,
    }))
);

export function PaymentFormContainer({ paymentId }: Readonly<{ paymentId?: string }>) {
  const viewModel = usePaymentFormViewModel({ paymentId });
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
