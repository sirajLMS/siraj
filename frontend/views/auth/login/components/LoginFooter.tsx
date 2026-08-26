"use client";

import { Box, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";

const StyledFooterContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(1),
  // Separator + breathing room above the copyright so it never overlaps the
  // Quick Login grid on small viewports (where vertical space is tight).
  pt: theme.spacing(2),
  mt: theme.spacing(0.5),
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
    <StyledFooterContainer>
      <StyledFooterText>© {year} Siraj LMS · All rights reserved</StyledFooterText>
    </StyledFooterContainer>
  );
}
