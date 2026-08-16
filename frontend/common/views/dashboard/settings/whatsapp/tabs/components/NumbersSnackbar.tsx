"use client";

import { FormErrorSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormErrorSnackbar";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import type { WhatsappSnackbar } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";

export function NumbersSnackbar({
  state,
  onClose,
}: Readonly<{ readonly state: WhatsappSnackbar; readonly onClose: () => void }>) {
  if (state === null) {
    return null;
  }
  if (state.severity === "error") {
    return <FormErrorSnackbar open onClose={onClose} message={state.message} />;
  }
  return <FormSuccessSnackbar open onClose={onClose} message={state.message} />;
}
