"use client";

import { Box, Card, Skeleton, Stack } from "@mui/material";

export function ProfileSkeleton() {
  return (
    <Box sx={{ width: "100%" }}>
      {/* Header Skeleton */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={_theme => ({
          alignItems: { xs: "flex-start", md: "center" },
          width: "100%",
        })}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Skeleton variant="circular" width={64} height={64} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" sx={{ fontSize: "1.5rem" }} />
          <Skeleton variant="text" width="40%" sx={{ fontSize: "1rem" }} />
        </Box>
      </Stack>

      {/* Desktop: Two Card Sections */}
      <Box sx={{ display: { xs: "none", md: "flex" }, gap: 3, mb: 3 }}>
        <Card sx={{ flex: 1, p: 3 }}>
          <Skeleton variant="text" width="80%" sx={{ fontSize: "1.25rem", mb: 2 }} />
          <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="60%" />
        </Card>
        <Card sx={{ flex: 1, p: 3 }}>
          <Skeleton variant="text" width="80%" sx={{ fontSize: "1.25rem", mb: 2 }} />
          <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="60%" />
        </Card>
      </Box>

      {/* Mobile: Stacked Cards */}
      <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", gap: 2 }}>
        <Card sx={{ p: 2 }}>
          <Skeleton variant="text" width="80%" sx={{ fontSize: "1.25rem", mb: 2 }} />
          <Skeleton variant="rectangular" height={80} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="60%" />
        </Card>
        <Card sx={{ p: 2 }}>
          <Skeleton variant="text" width="80%" sx={{ fontSize: "1.25rem", mb: 2 }} />
          <Skeleton variant="rectangular" height={80} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="60%" />
        </Card>
      </Box>
    </Box>
  );
}
