"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type AdminBillingViewModel,
  useAdminBillingViewModel,
} from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel";

const lazyViews = createLazyView<AdminBillingViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/admin/billing/adminBilling.mobile").then(m => ({
      default: m.AdminBillingMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/admin/billing/adminBilling.desktop").then(m => ({
      default: m.AdminBillingDesktopView,
    }))
);

export function OverviewTab() {
  const viewModel = useAdminBillingViewModel({});
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
