"use client";

import { Box, CircularProgress } from "@mui/material";

export function DesktopLoadingState() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <CircularProgress sx={theme => ({ color: theme.palette.primary.main })} />
    </Box>
  );
}
