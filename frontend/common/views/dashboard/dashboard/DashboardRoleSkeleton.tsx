import { Box, Skeleton } from "@mui/material";

/**
 * Per-role loading skeleton shown by `<Suspense fallback={<DashboardRoleSkeleton />} />`
 * while a role-specific dashboard container (Admin/Teacher/Parent/Student/Supervisor)
 * mounts. Mirrors the dashboard's metric-grid layout so the role tier's content
 * streaming in doesn't cause layout shift — the skeleton reserves the same
 * heading + metrics + content body proportions that the role view will occupy.
 *
 * Server Component-safe (pure presentational; no hooks, no `"use client"`).
 */
export function DashboardRoleSkeleton() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        width: "100%",
        maxWidth: "100%",
      }}
    >
      <Skeleton variant="text" width="40%" height={40} />

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} variant="rounded" width={160} height={100} sx={{ flexShrink: 0 }} />
        ))}
      </Box>

      <Skeleton variant="rounded" width="100%" height={300} />

      <Box sx={{ display: "flex", gap: 2 }}>
        <Skeleton variant="rounded" width="60%" height={200} />
        <Skeleton variant="rounded" width="38%" height={200} />
      </Box>
    </Box>
  );
}
