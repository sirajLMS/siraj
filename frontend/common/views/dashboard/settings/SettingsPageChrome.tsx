"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { SettingsViewModel } from "@/frontend/common/views/dashboard/settings/useSettingsViewModel";

const lazyChrome = createLazyView<SettingsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/settings.mobile").then(m => ({
      default: m.SettingsMobileChrome,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/settings.desktop").then(m => ({
      default: m.SettingsDesktopChrome,
    }))
);

export function SettingsPageChrome(viewModel: Readonly<SettingsViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyChrome.mobile} desktop={lazyChrome.desktop} props={viewModel} />;
}
