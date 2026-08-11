"use client";

import { useWhatsappSettingsViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel";
import { WhatsappConfigView } from "@/frontend/common/views/dashboard/settings/whatsapp/WhatsappConfigView";

export function WhatsappSettingsContainer() {
  const viewModel = useWhatsappSettingsViewModel();

  return <WhatsappConfigView {...viewModel} />;
}
