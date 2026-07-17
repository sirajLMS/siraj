"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

const StyledFieldLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  textTransform: "uppercase",
}));

export function FieldLabelMobile({ children }: Readonly<{ children: string }>) {
  return <StyledFieldLabel variant="labelMd">{children}</StyledFieldLabel>;
}

export function MobileFieldCard({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.surfaceContainerLowest,
        borderRadius: theme.layout.radius.card,
        padding: theme.layout.cardPadding,
        boxShadow: theme.palette.shadow.card,
      })}
    >
      <FieldLabelMobile>{label}</FieldLabelMobile>
      <Box sx={{ mt: 1 }}>{children}</Box>
    </Box>
  );
}
