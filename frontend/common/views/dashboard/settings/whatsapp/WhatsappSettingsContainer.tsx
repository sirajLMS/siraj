"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import { useWhatsappSettingsViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel";
import { WhatsappConfigView } from "@/frontend/common/views/dashboard/settings/whatsapp/WhatsappConfigView";

export function WhatsappSettingsContainer() {
  const viewModel = useWhatsappSettingsViewModel();

  return (
    <RequirePermission permissions={PAGE_PERMISSIONS.whatsappSettings} fallback={null}>
      <WhatsappConfigView {...viewModel} />
    </RequirePermission>
  );
}
