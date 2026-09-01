"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ComplaintsParentLabels } from "@/shared/locale";

interface ComplaintPolicyPanelSharedOptions {
  readonly marginTop: number;
  readonly padding: number;
}

interface ComplaintPolicyPanelSharedProps {
  readonly labels: ComplaintsParentLabels;
  readonly options: ComplaintPolicyPanelSharedOptions;
}

const StyledPolicyTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(1),
}));

const StyledPolicyBody = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
}));

const DESKTOP_OPTIONS: ComplaintPolicyPanelSharedOptions = { marginTop: 4, padding: 3 };
const MOBILE_OPTIONS: ComplaintPolicyPanelSharedOptions = { marginTop: 3, padding: 2 };

export function ComplaintPolicyPanelShared({ labels, options }: Readonly<ComplaintPolicyPanelSharedProps>) {
  return (
    <Box
      sx={theme => ({
        mt: options.marginTop,
        p: options.padding,
        borderRadius: theme.layout.radius.card,
        backgroundColor: theme.palette.primaryContainer,
        border: `1px solid ${theme.palette.outlineVariant}`,
      })}
    >
      <StyledPolicyTitle variant="titleLg">{labels.policyTitle}</StyledPolicyTitle>
      <StyledPolicyBody variant="bodyMd">{labels.policyBody}</StyledPolicyBody>
    </Box>
  );
}

export const COMPLAINT_POLICY_PANEL_DESKTOP_OPTIONS = DESKTOP_OPTIONS;
export const COMPLAINT_POLICY_PANEL_MOBILE_OPTIONS = MOBILE_OPTIONS;
