"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import { SettingsView } from "@/frontend/common/views/dashboard/settings/SettingsView";
import { useSettingsViewModel } from "@/frontend/common/views/dashboard/settings/useSettingsViewModel";

export function SettingsPageContainer() {
  const viewModel = useSettingsViewModel();

  return (
    <RequirePermission permissions={PAGE_PERMISSIONS.settings} fallback={null}>
      <SettingsView {...viewModel} />
    </RequirePermission>
  );
}
