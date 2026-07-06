"use client";

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledFooterContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
});

export function LoginFooter() {
  return <StyledFooterContainer sx={{ gap: 2, mt: 3 }} />;
}
