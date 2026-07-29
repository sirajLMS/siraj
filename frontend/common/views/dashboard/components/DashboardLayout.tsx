"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { DashboardLayoutLoading } from "@/frontend/common/views/dashboard/components/DashboardLayoutLoading";
import type { DashboardLayoutProps } from "@/frontend/common/views/dashboard/components/dashboardLayoutTypes";

export type { DashboardLayoutProps };

const lazyViews = createLazyView<DashboardLayoutProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/components/dashboardLayout.mobile").then(m => ({
      default: m.DashboardLayoutMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/components/dashboardLayout.desktop").then(m => ({
      default: m.DashboardLayoutDesktop,
    })),
  { loading: () => <DashboardLayoutLoading /> }
);

export function DashboardLayout(props: Readonly<DashboardLayoutProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
