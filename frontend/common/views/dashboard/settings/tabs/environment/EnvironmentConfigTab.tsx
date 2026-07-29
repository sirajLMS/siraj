"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { useEnvironmentConfigViewModel } from "@/frontend/common/views/dashboard/settings/tabs/environment/useEnvironmentConfigViewModel";
import type { EnvironmentConfigViewModel } from "@/frontend/common/views/dashboard/settings/types/environmentConfig.types";

const lazyViews = createLazyView<EnvironmentConfigViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/tabs/environment/environmentConfigTab.mobile").then(m => ({
      default: m.EnvironmentConfigTabMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/tabs/environment/environmentConfigTab.desktop").then(m => ({
      default: m.EnvironmentConfigTabDesktopView,
    }))
);

export function EnvironmentConfigTab() {
  const viewModel = useEnvironmentConfigViewModel();
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
