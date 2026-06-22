"use client";

import { HelpOutlined, Language } from "@mui/icons-material";
import { Box, IconButton, Link, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";

// Main footer container - centers content and adds top margin
const StyledFooterContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
});

// Text with secondary color and centered alignment
const StyledFooterText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textAlign: "center",
}));

// Register link with primary color and bold weight
const StyledRegisterLink = styled(Link)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 600,
}));

// Icon button row container
const StyledIconRow = styled(Box)({
  display: "flex",
});

// Footer icon buttons with hover effect
const StyledFooterIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
  "&:hover": {
    color: theme.palette.primary.main,
  },
}));

export function LoginFooter() {
  const t = useTranslations("auth.login");

  return (
    <StyledFooterContainer sx={{ gap: 2, mt: 3 }}>
      <StyledFooterText variant="bodyMd">
        {t("noAccount")}{" "}
        <StyledRegisterLink href="#" underline="hover">
          {t("register")}
        </StyledRegisterLink>
      </StyledFooterText>

      <StyledIconRow sx={{ gap: 1 }}>
        <StyledFooterIconButton size="small" aria-label="Help">
          <HelpOutlined />
        </StyledFooterIconButton>
        <StyledFooterIconButton size="small" aria-label="Language">
          <Language />
        </StyledFooterIconButton>
      </StyledIconRow>
    </StyledFooterContainer>
  );
}
