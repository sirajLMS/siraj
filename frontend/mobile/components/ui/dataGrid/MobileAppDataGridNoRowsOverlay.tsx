"use client";

import { Box, Typography } from "@mui/material";

interface MobileAppDataGridNoRowsOverlayProps {
  readonly message: string;
}

export function MobileAppDataGridNoRowsOverlay({ message }: Readonly<MobileAppDataGridNoRowsOverlayProps>) {
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
      <Typography sx={theme => ({ typography: "bodySm", color: theme.palette.text.secondary })}>{message}</Typography>
    </Box>
  );
}
