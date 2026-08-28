"use client";

import { Box } from "@mui/material";
import { TemplatesTabContent } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/TemplatesTabContent";
import type { TemplatesTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";

/**
 * Desktop wrapper for TemplatesTab.
 * Platform difference: desktop has no extra outer padding (the desktop layout provides page margins);
 * mobile owns its gutter via `MobileContentInset` and the list layout.
 */
export function TemplatesTabDesktop(props: Readonly<TemplatesTabSharedProps>) {
  return (
    <Box>
      <TemplatesTabContent {...props} />
    </Box>
  );
}
