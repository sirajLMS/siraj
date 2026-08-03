"use client";

import { Box } from "@mui/material";
import { TemplatesTabContent } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/TemplatesTabContent";
import type { TemplatesTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";

/**
 * Mobile wrapper for TemplatesTab.
 * Platform difference: mobile adds `sx={{ p: 2 }}` because the mobile shell is edge-to-edge (`px: 0`).
 * Desktop wrapper has no extra outer padding (the desktop layout provides page margins).
 */
export function TemplatesTabMobile(props: Readonly<TemplatesTabSharedProps>) {
  return (
    <Box sx={{ p: 2 }}>
      <TemplatesTabContent {...props} />
    </Box>
  );
}
