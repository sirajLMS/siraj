"use client";

import { School } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useAppTranslation } from "@/shared/locale/client";

// Main container for the login header section - centers content vertically
const StyledHeaderContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
});

// Circular icon container with primary background color
const StyledIconContainer = styled(Box)(({ theme }) => ({
  width: 64,
  height: 64,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: theme.palette.primary.main,
  borderRadius: Number(theme.shape.borderRadius) * 2,
}));

// School icon styled with onPrimary color for contrast
const StyledSchoolIcon = styled(School)(({ theme }) => ({
  fontSize: 40,
  color: theme.palette.onPrimary,
}));

// Main title typography with bold weight
const StyledTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: 700,
}));

// Subtitle with uppercase transformation and letter spacing
const StyledSubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
}));

export function LoginHeader() {
  const t = useAppTranslation().authTranslations.login;

  return (
    <StyledHeaderContainer sx={{ mb: 4 }}>
      <StyledIconContainer sx={{ mb: 2 }}>
        <StyledSchoolIcon />
      </StyledIconContainer>
      <StyledTitle variant="headlineLg" sx={{ mb: 0.5 }}>
        {t.title}
      </StyledTitle>
      <StyledSubtitle variant="bodyMd">{t.subtitle}</StyledSubtitle>
    </StyledHeaderContainer>
  );
}
