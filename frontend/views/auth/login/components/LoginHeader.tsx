"use client";

import { School } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import type { AuthLoginLabels } from "@/shared/locale/types/auth";

const StyledHeaderContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
});

// Gradient ring + soft glow around the brand icon. Uses alpha() on the
// primary palette so it adapts to light/dark themes (no hardcoded hex).
const StyledIconContainer = styled(Box)(({ theme }) => ({
  width: 64,
  height: 64,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: theme.palette.primary.main,
  borderRadius: Number(theme.shape.borderRadius) * 2,
  position: "relative",
  // Soft outer glow — layered box-shadow using primary + primaryContainer.
  boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.12)}, 0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
  // Subtle scale-in entrance on mount.
  animation: "sirajLoginIconEntrance 500ms cubic-bezier(0.16, 1, 0.3, 1)",
  "@keyframes sirajLoginIconEntrance": {
    "0%": { opacity: "0", transform: "scale(0.8)" },
    "100%": { opacity: "1", transform: "scale(1)" },
  },
}));

const StyledSchoolIcon = styled(School)(({ theme }) => ({
  fontSize: 40,
  color: theme.palette.onPrimary,
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: 700,
  // Gradient text fill for the title — adapts to light/dark via palette.
  backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
}));

const StyledSubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
}));

export interface LoginHeaderProps {
  readonly labels: AuthLoginLabels;
}

export function LoginHeader({ labels }: Readonly<LoginHeaderProps>) {
  return (
    <StyledHeaderContainer sx={{ mb: 4 }}>
      <StyledIconContainer sx={{ mb: 2 }}>
        <StyledSchoolIcon />
      </StyledIconContainer>
      <StyledTitle variant="headlineLg" sx={{ mb: 0.5 }}>
        {labels.title}
      </StyledTitle>
      <StyledSubtitle variant="bodyMd">{labels.subtitle}</StyledSubtitle>
    </StyledHeaderContainer>
  );
}
