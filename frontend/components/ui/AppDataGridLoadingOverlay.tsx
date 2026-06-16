"use client";

import { alpha, Box, CircularProgress } from "@mui/material";
import type { GridOverlayProps } from "@mui/x-data-grid";

export function AppDataGridLoadingOverlay(_props: GridOverlayProps) {
  return (
    <Box
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        py: theme.spacing(6),
        bgcolor: alpha(theme.palette.surface, 0.4),
      })}
    >
      <CircularProgress
        size={32}
        sx={theme => ({
          color: theme.palette.primary.main,
        })}
      />
    </Box>
  );
}
