"use client";

import { AppearanceSettingsTabShared } from "@/frontend/common/views/dashboard/settings/tabs/appearance/__shared__/appearanceSettingsTabShared";
import type { AppearanceSettingsViewModel } from "@/frontend/common/views/dashboard/settings/types/appearanceSettings.types";
import {
  DesktopExportButton,
  DesktopFilterButton,
  DesktopPrimaryPageAction,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";

/**
 * Desktop tier view for the Settings → Appearance tab. Panel chrome comes
 * from `DesktopSectionPanel` and action presets from the desktop action
 * buttons; all content is driven by the ViewModel.
 */
export function AppearanceSettingsTabDesktopView(viewModel: Readonly<AppearanceSettingsViewModel>) {
  return (
    <AppearanceSettingsTabShared
      viewModel={viewModel}
      SectionPanel={DesktopSectionPanel}
      slots={{
        PrimaryAction: DesktopPrimaryPageAction,
        SecondaryAction: DesktopFilterButton,
        ExportAction: DesktopExportButton,
      }}
    />
  );
}
