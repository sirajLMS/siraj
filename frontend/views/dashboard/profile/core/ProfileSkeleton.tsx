"use client";

import { Box, Card, Skeleton, Stack } from "@mui/material";

export function ProfileSkeleton() {
  return (
    <Box sx={{ width: "100%", p: 2 }}>
      {/* Header Skeleton */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 2, md: 3 }}
        sx={theme => ({
          alignItems: { xs: "flex-start", md: "center" },
          width: "100%",
          mb: 4,
          p: 2,
          borderRadius: theme.shape.borderRadius,
        })}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Skeleton variant="circular" width={64} height={64} />
        </Box>
        <Box sx={{ flex: 1, pt: 1 }}>
          <Skeleton variant="text" width="60%" sx={{ fontSize: "1.5rem" }} />
          <Skeleton variant="text" width="40%" sx={{ fontSize: "1rem" }} />
        </Box>
      </Stack>

      {/* Desktop: Two Card Sections */}
      <Box sx={{ display: { xs: "none", md: "flex" }, gap: 3, mb: 3 }}>
        <Card sx={{ flex: 1, p: 3, height: "fit-content" }}>
          <Skeleton variant="text" width="80%" sx={{ fontSize: "1.25rem", mb: 2 }} />
          <Skeleton variant="rectangular" height={120} sx={{ mb: 2, borderRadius: 1 }} />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="70%" sx={{ mt: 1.5 }} />
        </Card>
        <Card sx={{ flex: 1, p: 3, height: "fit-content" }}>
          <Skeleton variant="text" width="80%" sx={{ fontSize: "1.25rem", mb: 2 }} />
          <Skeleton variant="rectangular" height={120} sx={{ mb: 2, borderRadius: 1 }} />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="70%" sx={{ mt: 1.5 }} />
        </Card>
      </Box>

      {/* Mobile: Stacked Cards */}
      <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", gap: 2 }}>
        <Card sx={{ p: 2, width: "100%" }}>
          <Skeleton variant="text" width="80%" sx={{ fontSize: "1.25rem", mb: 1.5 }} />
          <Skeleton variant="rectangular" height={80} sx={{ mb: 1.5, borderRadius: 1 }} />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="70%" sx={{ mt: 1 }} />
        </Card>
        <Card sx={{ p: 2, width: "100%" }}>
          <Skeleton variant="text" width="80%" sx={{ fontSize: "1.25rem", mb: 1.5 }} />
          <Skeleton variant="rectangular" height={80} sx={{ mb: 1.5, borderRadius: 1 }} />
          <Skeleton variant="text" width="60%" />
        </Card>
        <Card sx={{ p: 2, width: "100%" }}>
          <Skeleton variant="text" width="80%" sx={{ fontSize: "1.25rem", mb: 1.5 }} />
          <Skeleton variant="rectangular" height={80} sx={{ mb: 1.5, borderRadius: 1 }} />
          <Skeleton variant="text" width="50%" />
        </Card>
      </Box>
    </Box>
  );
}
