import { Box, Skeleton } from "@mui/material";

/**
 * Dashboard loading skeleton — renders immediately during RSC streaming,
 * replacing the full-page CircularProgress. A skeleton that mirrors the
 * dashboard layout becomes the LCP element, so it paints before data loads.
 */
export default function DashboardLoading() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        p: { xs: 2, sm: 3 },
        width: "100%",
        maxWidth: "100%",
      }}
    >
      {/* Page heading */}
      <Skeleton variant="text" width="40%" height={40} />

      {/* Metrics row */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} variant="rounded" width={160} height={100} sx={{ flexShrink: 0 }} />
        ))}
      </Box>

      {/* Main content area */}
      <Skeleton variant="rounded" width="100%" height={300} />

      {/* Secondary row */}
      <Box sx={{ display: "flex", gap: 2 }}>
        <Skeleton variant="rounded" width="60%" height={200} />
        <Skeleton variant="rounded" width="38%" height={200} />
      </Box>
    </Box>
  );
}
