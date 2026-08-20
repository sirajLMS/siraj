"use client";

import { Box, Skeleton } from "@mui/material";

/**
 * Route-level loading skeleton for the quotas list page.
 * Renders while the page.tsx server component is resolving.
 * Mirrors the page layout: page heading and content area.
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
      <Skeleton variant="text" width="30%" height={40} />
      <Skeleton variant="rounded" width="100%" height={400} />
    </Box>
  );
}
