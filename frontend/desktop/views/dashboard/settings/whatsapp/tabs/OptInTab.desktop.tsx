"use client";

import { Box } from "@mui/material";
import { OptInTabContent } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/OptInTabContent";
import type { OptInTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";

/**
 * Desktop wrapper for OptInTab.
 * Platform difference: desktop has no extra outer padding (the desktop layout provides page margins).
 * Mobile wrapper adds `sx={{ p: 2 }}` because the mobile shell is edge-to-edge.
 */
export function OptInTabDesktop(props: Readonly<OptInTabSharedProps>) {
  return (
    <Box>
      <OptInTabContent {...props} />
    </Box>
  );
}
