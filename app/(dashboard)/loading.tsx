"use client";

import { Box, Skeleton } from "@mui/material";

/**
 * Generic dashboard page loading skeleton.
 * Applies to all routes under (dashboard) that don't have their own loading.tsx.
 * This catches /profile, /teachers, /students, etc. shown as /[tab] in analytics.
 */
export default function PageLoading() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        p: { xs: 2, sm: 3 },
        width: "100%",
      }}
    >
      {/* Page heading */}
      <Skeleton variant="text" width="35%" height={40} />

      {/* Subtitle / description */}
      <Skeleton variant="text" width="55%" height={24} />

      {/* Action row (buttons / filters) */}
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <Skeleton variant="rounded" width={120} height={36} />
        <Skeleton variant="rounded" width={100} height={36} />
      </Box>

      {/* Main content table / list area */}
      <Skeleton variant="rounded" width="100%" height={400} />
    </Box>
  );
}
