"use client";

import { Box, Typography } from "@mui/material";
import { overlayBoxSx } from "@/frontend/common/components/ui/dataGrid/appDataGridOverlaySharedUtils";

interface AppDataGridNoRowsOverlayProps {
  readonly message: string;
}

export function AppDataGridNoRowsOverlay({ message }: Readonly<AppDataGridNoRowsOverlayProps>) {
  return (
    <Box sx={overlayBoxSx}>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
        {message}
      </Typography>
    </Box>
  );
}
