"use client";

import { Box } from "@mui/material";
import { OptInTabContent } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/OptInTabContent";
import type { OptInTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";

/**
 * Mobile wrapper for OptInTab.
 * Platform difference: mobile adds `sx={{ p: 2 }}` because the mobile shell is edge-to-edge (`px: 0`).
 * Desktop wrapper has no extra outer padding (the desktop layout provides page margins).
 */
export function OptInTabMobile(props: Readonly<OptInTabSharedProps>) {
  return (
    <Box sx={{ p: 2 }}>
      <OptInTabContent {...props} />
    </Box>
  );
}
