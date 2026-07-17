"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { AdminDashboardViewModel } from "@/frontend/common/views/dashboard/admin/home/useAdminDashboardViewModel";

const lazyViews = createLazyView<AdminDashboardViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/admin/home/adminDashboard.mobile").then(m => ({
      default: m.AdminDashboardMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/admin/home/adminDashboard.desktop").then(m => ({
      default: m.AdminDashboardDesktopView,
    }))
);

export function AdminDashboardView(props: Readonly<AdminDashboardViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}

export type { AdminDashboardViewModel };
