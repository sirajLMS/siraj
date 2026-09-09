"use client";

import { Box } from "@mui/material";
import { WhatsappConfigTabContent } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/WhatsappConfigTabContent";
import type { WhatsappConfigTabViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappConfigView.types";

/**
 * Mobile wrapper for the Cloud API configuration tab. The shared content owns
 * the form; the wrapper keeps the mobile stack at a tighter rhythm.
 */
export function ConfigTabMobile(vm: Readonly<WhatsappConfigTabViewModel>) {
  return (
    <Box sx={{ py: 1 }}>
      <WhatsappConfigTabContent {...vm} />
    </Box>
  );
}
