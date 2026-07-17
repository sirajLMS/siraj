"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ComplaintsParentLabels } from "@/shared/locale";

const StyledPolicyPanelBox = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(2),
  borderRadius: theme.layout.radius.card,
  backgroundColor: theme.palette.primaryContainer,
  border: `1px solid ${theme.palette.outlineVariant}`,
}));

const StyledPolicyTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(1),
}));

const StyledPolicyBody = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
}));

interface ComplaintPolicyPanelMobileProps {
  readonly labels: ComplaintsParentLabels;
}

export function ComplaintPolicyPanelMobile({ labels }: Readonly<ComplaintPolicyPanelMobileProps>) {
  return (
    <StyledPolicyPanelBox>
      <StyledPolicyTitle variant="titleLg">{labels.policyTitle}</StyledPolicyTitle>
      <StyledPolicyBody variant="bodyMd">{labels.policyBody}</StyledPolicyBody>
    </StyledPolicyPanelBox>
  );
}
