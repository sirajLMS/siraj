"use client";

import { Box, Skeleton, Stack } from "@mui/material";

export function TeacherProfileLoadingSkeleton() {
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
        <Skeleton variant="rounded" height={160} />
      </Box>
      <Skeleton variant="rounded" height={120} />
    </Stack>
  );
}
