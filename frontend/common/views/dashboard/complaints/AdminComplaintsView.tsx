"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { AdminComplaintsViewModel } from "@/frontend/common/views/dashboard/complaints/useAdminComplaintsViewModel";

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

export function AdminComplaintsView(props: Readonly<AdminComplaintsViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}

export type { AdminComplaintsViewModel };
