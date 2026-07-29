"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { useSettingsTimezonesViewModel } from "@/frontend/common/views/dashboard/settings/tabs/timezones/useSettingsTimezonesViewModel";
import type { SettingsTimezonesViewModel } from "@/frontend/common/views/dashboard/settings/types/settingsTimezones.types";

const lazyViews = createLazyView<SettingsTimezonesViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/tabs/timezones/settingsTimezonesTab.mobile").then(m => ({
      default: m.SettingsTimezonesTabMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/tabs/timezones/settingsTimezonesTab.desktop").then(m => ({
      default: m.SettingsTimezonesTabDesktopView,
    }))
);

export function SettingsTimezonesTab() {
  const viewModel = useSettingsTimezonesViewModel();
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
