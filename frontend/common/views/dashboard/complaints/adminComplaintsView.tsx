"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type AdminComplaintsViewModel,
  type UseAdminComplaintsViewModelProps,
  useAdminComplaintsViewModel,
} from "@/frontend/common/views/dashboard/complaints/useAdminComplaintsViewModel";

export type { AdminComplaintsViewModel };

const lazyViews = createLazyView<AdminComplaintsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/complaints/adminComplaints.mobile").then(m => ({
      default: m.AdminComplaintsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/complaints/adminComplaints.desktop").then(m => ({
      default: m.AdminComplaintsDesktopView,
    }))
);

export function AdminComplaintsView(props: Readonly<UseAdminComplaintsViewModelProps>) {
  const viewModel = useAdminComplaintsViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
