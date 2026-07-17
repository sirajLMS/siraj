"use client";

import { Box, Typography } from "@mui/material";

interface DesktopAppDataGridNoRowsOverlayProps {
  readonly message: string;
}

export function DesktopAppDataGridNoRowsOverlay({ message }: Readonly<DesktopAppDataGridNoRowsOverlayProps>) {
  return (
    <Box
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        py: theme.spacing(6),
      })}
    >
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
        {message}
      </Typography>
    </Box>
  );
}
