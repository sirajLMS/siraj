"use client";

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { LanguageSwitcher, ThemeSwitcher } from "@/frontend/views/dashboard/components/navbar";

// Main container positioned at top-right with flex layout
const StyledContainer = styled(Box)({
  position: "absolute",
  top: 16,
  right: 16,
  display: "flex",
  alignItems: "center",
});

// Wrapper for each switcher with header container background
const StyledSwitcherWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.headerContainer,
  borderRadius: theme.shape.borderRadius,
}));

export function ThemeLanguageControls() {
  return (
    <StyledContainer sx={{ gap: 2 }}>
      <StyledSwitcherWrapper>
        <LanguageSwitcher />
      </StyledSwitcherWrapper>
      <StyledSwitcherWrapper>
        <ThemeSwitcher />
      </StyledSwitcherWrapper>
    </StyledContainer>
  );
}
