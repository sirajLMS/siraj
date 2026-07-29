"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { SettingsTabNavVariantProps } from "@/frontend/common/views/dashboard/settings/types/settingsTabNav.types";

const lazyViews = createLazyView<SettingsTabNavVariantProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/settingsTabNav.mobile").then(m => ({
      default: m.SettingsTabNavMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/settingsTabNav.desktop").then(m => ({
      default: m.SettingsTabNavDesktopView,
    }))
);

export function SettingsTabNav({ activeTab, tabs }: Readonly<SettingsTabNavVariantProps>) {
  if (tabs.length === 0) {
    return null;
  }

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={{ activeTab, tabs }} />;
}
