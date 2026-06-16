"use client";

import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

export function FieldLabel({ children }: Readonly<{ children: string }>) {
  return (
    <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, textTransform: "uppercase" })}>
      {children}
    </Typography>
  );
}

export function MobileFieldCard({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <Box
      sx={theme => ({
        bgcolor: theme.palette.surfaceContainerLowest,
        borderRadius: theme.layout.radius.card,
        p: theme.layout.cardPadding,
        boxShadow: theme.palette.shadow.card,
      })}
    >
      <FieldLabel>{label}</FieldLabel>
      <Box sx={{ mt: 1 }}>{children}</Box>
    </Box>
  );
}
