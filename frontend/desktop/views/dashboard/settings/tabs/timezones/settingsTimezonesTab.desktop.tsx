"use client";

import { DESKTOP_TAB_OPTIONS } from "@/frontend/common/views/dashboard/settings/tabs/__shared__/settingsTabShared.options";
import { SettingsTimezonesTabShared } from "@/frontend/common/views/dashboard/settings/tabs/timezones/__shared__/settingsTimezonesTabShared";
import type { SettingsTimezonesViewModel } from "@/frontend/common/views/dashboard/settings/types/settingsTimezones.types";

export function SettingsTimezonesTabDesktopView(viewModel: Readonly<SettingsTimezonesViewModel>) {
  return <SettingsTimezonesTabShared viewModel={viewModel} options={DESKTOP_TAB_OPTIONS} />;
}
