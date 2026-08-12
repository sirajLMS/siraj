"use client";

import { alpha, Box, CircularProgress } from "@mui/material";
import type { GridOverlayProps } from "@mui/x-data-grid";
import { overlayBoxSx } from "@/frontend/common/components/ui/dataGrid/appDataGridOverlaySharedUtils";

export function AppDataGridLoadingOverlay(_props: GridOverlayProps) {
  return (
    <Box sx={theme => ({ ...overlayBoxSx(theme), backgroundColor: alpha(theme.palette.surface, 0.4) })}>
      <CircularProgress
        size={32}
        sx={theme => ({
          color: theme.palette.primary.main,
        })}
      />
    </Box>
  );
}
