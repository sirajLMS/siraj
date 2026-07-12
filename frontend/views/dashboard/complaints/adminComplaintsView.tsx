"use client";

import { createLazyView } from "@/frontend/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/components/ui/container/ResponsiveViewSwitch";
import {
  type AdminComplaintsViewModel,
  type UseAdminComplaintsViewModelProps,
  useAdminComplaintsViewModel,
} from "@/frontend/views/dashboard/complaints/useAdminComplaintsViewModel";

export type { AdminComplaintsViewModel };

const lazyViews = createLazyView<AdminComplaintsViewModel>(
  () =>
    import("@/frontend/views/dashboard/complaints/mobile/adminComplaints.mobile").then(m => ({
      default: m.AdminComplaintsMobileView,
    })),
  () =>
    import("@/frontend/views/dashboard/complaints/desktop/adminComplaints.desktop").then(m => ({
      default: m.AdminComplaintsDesktopView,
    }))
);

export function AdminComplaintsView(props: Readonly<UseAdminComplaintsViewModelProps>) {
  const viewModel = useAdminComplaintsViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
