import { Box, Skeleton } from "@mui/material";

const NAV_SKELETON_IDS = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

/**
 * Fixed-height placeholder for the dashboard chrome while
 * `DashboardProfileShell` streams the user profile on first paint.
 */
export function DashboardShellSkeleton() {
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
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Skeleton variant="rectangular" height={64} sx={{ flexShrink: 0 }} />
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3 } }}>
          <Skeleton variant="text" width="35%" height={40} />
          <Skeleton variant="text" width="55%" height={24} sx={{ mt: 1 }} />
          <Skeleton variant="rounded" width="100%" height={400} sx={{ mt: 3 }} />
        </Box>
      </Box>
    </Box>
  );
}
