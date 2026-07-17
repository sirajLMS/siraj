"use client";

import { Box, Card, Skeleton, Stack } from "@mui/material";

export function ProfileSkeletonDesktopView() {
  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <Stack
        direction={{ md: "row" }}
        spacing={3}
        sx={theme => ({
          alignItems: "center",
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

      <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
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
    </Box>
  );
}
