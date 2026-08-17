"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { QuotaFormAccessProvider } from "@/frontend/common/views/dashboard/billing/quota/QuotaFormAccessProvider";
import {
  type UseQuotaFormViewModel,
  useQuotaFormViewModel,
} from "@/frontend/common/views/dashboard/billing/quota/useQuotaFormViewModel";

const lazyViews = createLazyView<UseQuotaFormViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/billing/quota/quotaForm.mobile").then(m => ({
      default: m.QuotaFormMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/billing/quota/quotaForm.desktop").then(m => ({
      default: m.QuotaFormDesktopView,
    }))
);

export interface QuotaFormContainerProps {
  readonly quotaId?: string;
}

export function QuotaFormContainer({ quotaId }: Readonly<QuotaFormContainerProps>) {
  const vm = useQuotaFormViewModel({ quotaId });

  return (
    <QuotaFormAccessProvider labels={vm.labels}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={vm} />
    </QuotaFormAccessProvider>
  );
}
