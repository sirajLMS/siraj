"use client";

import { useWhatsappSettingsViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel";
import { WhatsappConfigView } from "@/frontend/common/views/dashboard/settings/whatsapp/WhatsappConfigView";

export function WhatsappSettingsContainer(props: Readonly<{ esConfigId?: string | null; esAppId?: string | null }>) {
  const viewModel = useWhatsappSettingsViewModel(props);

  return <WhatsappConfigView {...viewModel} />;
}
