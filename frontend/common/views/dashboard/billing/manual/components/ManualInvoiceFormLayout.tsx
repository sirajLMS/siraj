"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

// Field label with uppercase transformation and surface variant color
const StyledFieldLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  textTransform: "uppercase",
}));

// Mobile field card with surface background, card radius, and card shadow
const StyledMobileFieldCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.surfaceContainerLowest,
  borderRadius: theme.layout.radius.card,
  padding: theme.layout.cardPadding,
  boxShadow: theme.palette.shadow.card,
}));

export function FieldLabel({ children }: Readonly<{ children: string }>) {
  return <StyledFieldLabel variant="labelMd">{children}</StyledFieldLabel>;
}

export function MobileFieldCard({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <StyledMobileFieldCard>
      <FieldLabel>{label}</FieldLabel>
      <Box sx={{ mt: 1 }}>{children}</Box>
    </StyledMobileFieldCard>
  );
}
