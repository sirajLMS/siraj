"use client";

import { SettingsView } from "@/frontend/common/views/dashboard/settings/SettingsView";
import { useSettingsViewModel } from "@/frontend/common/views/dashboard/settings/useSettingsViewModel";

export function SettingsPageContainer() {
  const viewModel = useSettingsViewModel();

  return <SettingsView {...viewModel} />;
}
