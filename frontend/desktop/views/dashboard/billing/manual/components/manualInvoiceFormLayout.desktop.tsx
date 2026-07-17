"use client";

import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledFieldLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  textTransform: "uppercase",
}));

export function FieldLabelDesktop({ children }: Readonly<{ children: string }>) {
  return <StyledFieldLabel variant="labelMd">{children}</StyledFieldLabel>;
}
