"use client";

import { Box, Card, Skeleton, Stack } from "@mui/material";

export function ProfileSkeletonMobileView() {
  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <Stack
        direction={{ xs: "column" }}
        spacing={2}
        sx={theme => ({
          alignItems: "flex-start",
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

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
