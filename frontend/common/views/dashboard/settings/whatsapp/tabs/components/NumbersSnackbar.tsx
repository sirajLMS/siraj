"use client";

import { AppSnackbar } from "@/frontend/common/components/ui/state/AppSnackbar";
import type { WhatsappSnackbarState } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";

export function NumbersSnackbar({
  state,
  onClose,
}: Readonly<{ readonly state: WhatsappSnackbarState; readonly onClose: () => void }>) {
  return <AppSnackbar state={state} onClose={onClose} />;
}
