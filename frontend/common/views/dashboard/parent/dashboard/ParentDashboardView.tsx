"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { ParentDashboardViewModel } from "@/frontend/common/views/dashboard/parent/dashboard/useParentDashboardViewModel";

const lazyViews = createLazyView<ParentDashboardViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/parent/dashboard/parentDashboard.mobile").then(m => ({
      default: m.ParentDashboardMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/parent/dashboard/parentDashboard.desktop").then(m => ({
      default: m.ParentDashboardDesktopView,
    }))
);

export function ParentDashboardView(props: Readonly<ParentDashboardViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}

export type { ParentDashboardViewModel };
