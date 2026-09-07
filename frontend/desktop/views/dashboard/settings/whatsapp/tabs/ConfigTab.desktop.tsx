"use client";

import { Box } from "@mui/material";
import { WhatsappConfigTabContent } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/WhatsappConfigTabContent";
import type { WhatsappConfigTabViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappConfigView.types";

/**
 * Desktop wrapper for the Cloud API configuration tab. The shared content owns
 * the form; the wrapper constrains the field grid to a comfortable width.
 */
export function ConfigTabDesktop(vm: Readonly<WhatsappConfigTabViewModel>) {
  return (
    <Box sx={{ maxWidth: 960 }}>
      <WhatsappConfigTabContent {...vm} />
    </Box>
  );
}
