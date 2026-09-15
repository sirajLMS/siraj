"use client";

import { AppearanceSettingsTabShared } from "@/frontend/common/views/dashboard/settings/tabs/appearance/__shared__/appearanceSettingsTabShared";
import type { AppearanceSettingsViewModel } from "@/frontend/common/views/dashboard/settings/types/appearanceSettings.types";
import {
  MobileExportButton,
  MobileFilterButton,
  MobilePrimaryPageAction,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";

/**
 * Mobile tier view for the Settings → Appearance tab. Panel chrome comes
 * from `MobileSectionPanel` and action presets from the mobile action
 * buttons; all content is driven by the ViewModel.
 */
export function AppearanceSettingsTabMobileView(viewModel: Readonly<AppearanceSettingsViewModel>) {
  return (
    <AppearanceSettingsTabShared
      viewModel={viewModel}
      SectionPanel={MobileSectionPanel}
      slots={{
        PrimaryAction: MobilePrimaryPageAction,
        SecondaryAction: MobileFilterButton,
        ExportAction: MobileExportButton,
      }}
    />
  );
}
