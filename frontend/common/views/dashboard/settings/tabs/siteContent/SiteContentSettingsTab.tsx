"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { useSiteContentSettingsViewModel } from "@/frontend/common/views/dashboard/settings/tabs/siteContent/useSiteContentSettingsViewModel";
import type { SiteContentSettingsViewModel } from "@/frontend/common/views/dashboard/settings/types/siteContentSettings.types";

const lazyViews = createLazyView<SiteContentSettingsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/tabs/siteContent/siteContentSettingsTab.mobile").then(m => ({
      default: m.SiteContentSettingsTabMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/tabs/siteContent/siteContentSettingsTab.desktop").then(m => ({
      default: m.SiteContentSettingsTabDesktopView,
    }))
);

export function SiteContentSettingsTab() {
  const viewModel = useSiteContentSettingsViewModel({});
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
