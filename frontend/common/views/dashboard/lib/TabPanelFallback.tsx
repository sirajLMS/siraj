"use client";

import { Box, CircularProgress } from "@mui/material";

export function TabPanelFallback() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
      <CircularProgress size={28} />
    </Box>
  );
}
