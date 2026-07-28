"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { useSettingsAuditViewModel } from "@/frontend/common/views/dashboard/settings/tabs/audit/useSettingsAuditViewModel";
import type { SettingsAuditViewModel } from "@/frontend/common/views/dashboard/settings/types/settingsAuditViewModel.types";

const lazyViews = createLazyView<SettingsAuditViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/tabs/audit/settingsAuditTab.mobile").then(m => ({
      default: m.SettingsAuditTabMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/tabs/audit/settingsAuditTab.desktop").then(m => ({
      default: m.SettingsAuditTabDesktopView,
    }))
);

export function SettingsAuditTab() {
  const viewModel = useSettingsAuditViewModel();
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
