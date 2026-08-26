"use client";

import { Box, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";

const StyledFooterContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(1),
  // Substantial breathing room above the separator and copyright line
  pt: theme.spacing(6),
  mt: theme.spacing(4),
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
}));

const StyledFooterText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: "0.75rem",
  letterSpacing: "0.02em",
}));

export function LoginFooter() {
  const year = new Date().getFullYear();
  return (
    <StyledFooterContainer sx={{ pt: 4, mt: 3 }}>
      <StyledFooterText sx={{ mt: 1 }}>© {year} Siraj LMS · All rights reserved</StyledFooterText>
    </StyledFooterContainer>
  );
}
