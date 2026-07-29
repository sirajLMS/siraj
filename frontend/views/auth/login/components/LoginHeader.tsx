"use client";

import { School } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { AuthLoginLabels } from "@/shared/locale/types/auth";

const StyledHeaderContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
});

const StyledIconContainer = styled(Box)(({ theme }) => ({
  width: 64,
  height: 64,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: theme.palette.primary.main,
  borderRadius: Number(theme.shape.borderRadius) * 2,
}));

const StyledSchoolIcon = styled(School)(({ theme }) => ({
  fontSize: 40,
  color: theme.palette.onPrimary,
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: 700,
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
