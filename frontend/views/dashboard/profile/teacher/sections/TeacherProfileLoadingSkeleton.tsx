"use client";

import { Box, Card, Skeleton, Stack } from "@mui/material";

export function TeacherProfileLoadingSkeleton() {
  return (
    <Box sx={{ p: 2, width: "100%" }}>
      <Stack spacing={{ xs: 2, md: 3 }}>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 2, md: 3 },
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "repeat(2, minmax(0, 1fr))",
            },
          }}
        >
          <Card sx={{ p: 2, height: "fit-content" }}>
            <Skeleton variant="text" width="70%" sx={{ fontSize: "1.25rem", mb: 2 }} />
            <Skeleton variant="rectangular" height={140} sx={{ mb: 2, borderRadius: 1 }} />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="70%" sx={{ mt: 1.5 }} />
          </Card>
          <Card sx={{ p: 2, height: "fit-content" }}>
            <Skeleton variant="text" width="70%" sx={{ fontSize: "1.25rem", mb: 2 }} />
            <Skeleton variant="rectangular" height={120} sx={{ mb: 2, borderRadius: 1 }} />
            <Skeleton variant="text" width="50%" />
          </Card>
          <Card sx={{ p: 2, height: "fit-content" }}>
            <Skeleton variant="text" width="80%" sx={{ fontSize: "1.25rem", mb: 2 }} />
            <Skeleton variant="rectangular" height={120} sx={{ mb: 2, borderRadius: 1 }} />
            <Skeleton variant="text" width="60%" />
          </Card>
          <Card sx={{ p: 2, height: "fit-content" }}>
            <Skeleton variant="text" width="75%" sx={{ fontSize: "1.25rem", mb: 2 }} />
            <Skeleton variant="rectangular" height={110} sx={{ mb: 2, borderRadius: 1 }} />
            <Skeleton variant="text" width="50%" />
          </Card>
        </Box>
        <Card sx={{ p: 2, width: "100%" }}>
          <Skeleton variant="text" width="60%" sx={{ fontSize: "1.1rem", mb: 1.5 }} />
          <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1 }} />
        </Card>
      </Stack>
    </Box>
  );
}
