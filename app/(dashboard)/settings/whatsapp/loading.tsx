"use client";

import { Box, Skeleton } from "@mui/material";

/**
 * Route-level loading skeleton for the WhatsApp settings page.
 * Renders while the page.tsx server component is resolving.
 * Mirrors the page layout: page heading, tab bar, and content area.
 */
export default function Loading() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        p: { xs: 2, sm: 3 },
        width: "100%",
      }}
    >
      {/* Page heading — matches DesktopPageHeader / MobilePageHeader */}
      <Skeleton variant="text" width="30%" height={40} />

      {/* Tab bar — matches the tab nav rendered by WhatsappTabNav / GenericTabNav */}
      <Box sx={{ display: "flex", gap: 1.5, borderBottom: "1px solid", borderColor: "divider", pb: 1 }}>
        <Skeleton variant="rounded" width={100} height={36} />
        <Skeleton variant="rounded" width={120} height={36} />
        <Skeleton variant="rounded" width={80} height={36} />
      </Box>

      {/* Main content area — matches the tab content region */}
      <Skeleton variant="rounded" width="100%" height={400} />
    </Box>
  );
}
