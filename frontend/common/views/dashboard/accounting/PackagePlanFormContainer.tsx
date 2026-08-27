"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { usePackagePlanFormViewModel } from "@/frontend/common/views/dashboard/accounting/usePackagePlanFormViewModel";

const lazyViews = createLazyView<ReturnType<typeof usePackagePlanFormViewModel>>(
  () =>
    import("@/frontend/mobile/views/dashboard/accounting/PackagePlanFormView.mobile").then(m => ({
      default: m.PackagePlanFormMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/accounting/PackagePlanFormView.desktop").then(m => ({
      default: m.PackagePlanFormDesktop,
    }))
);

export function PackagePlanFormContainer({ planId }: Readonly<{ planId?: string }>) {
  const viewModel = usePackagePlanFormViewModel({ planId });
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
