"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { useGeneralSettingsViewModel } from "@/frontend/common/views/dashboard/settings/tabs/general/useGeneralSettingsViewModel";
import type { GeneralSettingsViewModel } from "@/frontend/common/views/dashboard/settings/types/generalSettings.types";

const lazyViews = createLazyView<GeneralSettingsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/tabs/general/generalSettingsTab.mobile").then(m => ({
      default: m.GeneralSettingsTabMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/tabs/general/generalSettingsTab.desktop").then(m => ({
      default: m.GeneralSettingsTabDesktopView,
    }))
);

export function GeneralSettingsTab() {
  const viewModel = useGeneralSettingsViewModel({});
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
