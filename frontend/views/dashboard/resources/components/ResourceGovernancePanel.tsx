"use client";

import { VisibilityOffOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { ResourcesLabels } from "@/shared/messages/types/dashboard/resources/main";

interface ResourceGovernancePanelProps {
  readonly labels: ResourcesLabels;
}

export function ResourceGovernancePanel({ labels }: Readonly<ResourceGovernancePanelProps>) {
  return (
    <Box
      sx={theme => ({
        mt: 3,
        pt: 3,
        borderTop: `1px solid ${theme.palette.outlineVariant}`,
        display: "flex",
        gap: 2,
      })}
    >
      <Box
        sx={theme => ({
          p: 1,
          borderRadius: "50%",
          bgcolor: theme.palette.surfaceContainer,
          height: "fit-content",
        })}
      >
        <VisibilityOffOutlined sx={theme => ({ color: theme.palette.onSurfaceVariant })} />
      </Box>
      <Box>
        <Typography variant="labelMd" sx={{ fontWeight: 700, textTransform: "uppercase", mb: 0.5 }}>
          {labels.governance.title}
        </Typography>
        <Typography variant="bodyMd" sx={theme => ({ fontStyle: "italic", color: theme.palette.onSurfaceVariant })}>
          {labels.governance.body}
        </Typography>
      </Box>
    </Box>
  );
}
