"use client";

import { alpha, styled } from "@mui/material/styles";
import { Link } from "@/shared/i18n";

export const ActionIconLink = styled(Link)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  borderRadius: Number(theme.shape.borderRadius),
  color: theme.palette.onSurfaceVariant,
  textDecoration: "none",
  flexShrink: 0,
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    color: theme.palette.primary.main,
  },
  "&:focus-visible": {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
}));
