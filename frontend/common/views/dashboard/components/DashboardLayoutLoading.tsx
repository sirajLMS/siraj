"use client";

import { Box, Skeleton } from "@mui/material";

const NAV_SKELETON_IDS = ["a", "b", "c", "d", "e", "f"] as const;

/** Placeholder while mobile/desktop dashboard layout chunks load. */
export function DashboardLayoutLoading() {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          width: 280,
          flexShrink: 0,
          borderRight: 1,
          borderColor: "divider",
          p: 2,
        }}
      >
        <Skeleton variant="rounded" width="70%" height={32} sx={{ mb: 2 }} />
        {NAV_SKELETON_IDS.map(id => (
          <Skeleton key={id} variant="rounded" height={40} sx={{ mb: 1 }} />
        ))}
      </Box>
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Skeleton variant="rectangular" height={64} />
        <Box sx={{ flex: 1, p: 3 }}>
          <Skeleton variant="rounded" width="100%" height={320} />
        </Box>
      </Box>
    </Box>
  );
}
