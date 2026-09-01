"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { CustomizeModeShell } from "@/frontend/common/views/dashboard/components/customize/CustomizeModeShell";
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

/**
 * Dashboard layout entrypoint. In customize mode (`?customize=1`) the whole
 * dashboard renders inside {@link CustomizeModeShell} — the customization
 * layout that owns the toolbar and the shared dashboard offsets. The
 * customize sidebar is desktop-only and is mounted by
 * `DashboardLayoutDesktop` itself.
 */
export function DashboardLayout(props: Readonly<DashboardLayoutProps>) {
  return (
    <CustomizeModeShell>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />
    </CustomizeModeShell>
  );
}
