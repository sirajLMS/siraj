"use client";

import { Box, CircularProgress } from "@mui/material";

/**
 * Mobile loading state. Renders a full-width centered spinner with a shorter
 * `minHeight` so it doesn't push content below the fold on smaller viewports.
 */
export function MobileLoadingState() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "40vh",
        width: "100%",
      }}
    >
      <CircularProgress sx={theme => ({ color: theme.palette.primary.main })} />
    </Box>
  );
}
