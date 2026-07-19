"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";

export function MobileFieldCard({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.surfaceContainerLowest,
        borderRadius: theme.layout.radius.card,
        padding: theme.layout.cardPadding,
        boxShadow: theme.palette.shadow.card,
      })}
    >
      {children}
    </Box>
  );
}
