"use client";

import { Box, Skeleton } from "@mui/material";
import type { ReactElement } from "react";

export function QuotaDetailLoadingSkeleton(): ReactElement {
  return (
    <Box component="output" aria-busy="true" sx={{ display: "flex", flexDirection: "column", gap: 3, py: 3 }}>
      <Skeleton variant="rectangular" sx={{ height: 80 }} />
      <Skeleton variant="rectangular" sx={{ height: 200 }} />
      <Skeleton variant="rectangular" sx={{ height: 400 }} />
    </Box>
  );
}
