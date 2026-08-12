"use client";

import { DESKTOP_TAB_OPTIONS } from "@/frontend/common/views/dashboard/settings/tabs/__shared__/settingsTabShared.options";
import { SettingsAuditTabShared } from "@/frontend/common/views/dashboard/settings/tabs/audit/__shared__/settingsAuditTabShared";
import type { SettingsAuditViewModel } from "@/frontend/common/views/dashboard/settings/types/settingsAuditViewModel.types";

export function SettingsAuditTabDesktopView(viewModel: Readonly<SettingsAuditViewModel>) {
  return <SettingsAuditTabShared viewModel={viewModel} options={DESKTOP_TAB_OPTIONS} />;
}
