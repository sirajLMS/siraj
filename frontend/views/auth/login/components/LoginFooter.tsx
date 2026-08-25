"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledFooterContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const StyledFooterText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: "0.75rem",
  letterSpacing: "0.02em",
}));

export function LoginFooter() {
  const year = new Date().getFullYear();
  return (
    <StyledFooterContainer>
      <StyledFooterText>© {year} Siraj LMS · All rights reserved</StyledFooterText>
    </StyledFooterContainer>
  );
}
