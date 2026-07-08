"use client";

import { Box, Skeleton, Stack } from "@mui/material";

export function StaffProfileLoadingSkeleton() {
  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "repeat(2, minmax(0, 1fr))",
          },
        }}
      >
        <Skeleton variant="rounded" height={220} />
        <Skeleton variant="rounded" height={180} />
        <Skeleton variant="rounded" height={180} />
      </Box>
      <Skeleton variant="rounded" height={280} />
    </Stack>
  );
}
