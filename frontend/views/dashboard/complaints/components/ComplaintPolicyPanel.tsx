"use client";

import { Box, Typography } from "@mui/material";
import type { ComplaintsParentLabels } from "@/frontend/messages/types/dashboard/complaints/main";

interface ComplaintPolicyPanelProps {
  readonly labels: ComplaintsParentLabels;
}

export function ComplaintPolicyPanel({ labels }: Readonly<ComplaintPolicyPanelProps>) {
  return (
    <Box
      sx={theme => ({
        mt: 4,
        p: 3,
        borderRadius: theme.layout.radius.card,
        bgcolor: theme.palette.primaryContainer,
        border: `1px solid ${theme.palette.outlineVariant}`,
      })}
    >
      <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, mb: 1 })}>
        {labels.policyTitle}
      </Typography>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {labels.policyBody}
      </Typography>
    </Box>
  );
}
