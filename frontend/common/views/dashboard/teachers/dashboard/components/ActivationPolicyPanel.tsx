"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, Link, Paper, Typography } from "@mui/material";
import type { TeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";

interface ActivationPolicyPanelProps {
  readonly labels: TeacherDashboardLabels["policy"];
  readonly compact?: boolean;
  readonly onDownloadHandbook: () => void;
  readonly onContactCoordinator: () => void;
  readonly actionLabels: TeacherDashboardLabels["actions"];
}

export function ActivationPolicyPanel({
  labels,
  compact = false,
  onDownloadHandbook,
  onContactCoordinator,
  actionLabels,
}: Readonly<ActivationPolicyPanelProps>) {
  const description = compact ? labels.descriptionMobile : labels.description;

  return (
    <Paper
      variant="outlined"
      sx={theme => ({
        p: compact ? 2 : 3,
        borderStyle: compact ? "solid" : "dashed",
        borderColor: theme.palette.border.light,
        backgroundColor: theme.palette.surfaceContainerLowest,
        display: "flex",
        gap: 2,
        alignItems: "flex-start",
      })}
    >
      <Box
        sx={theme => ({
          width: 48,
          height: 48,
          borderRadius: "50%",
          backgroundColor: theme.palette.primaryContainer,
          color: theme.palette.onPrimaryContainer,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        })}
      >
        <InfoOutlined />
      </Box>
      <Box>
        <Typography sx={{ typography: "titleLg", color: theme => theme.palette.primary.main, mb: 1 }}>
          {labels.title}
        </Typography>
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary, mb: compact ? 0 : 2 }}>
          {description}
        </Typography>
        {!compact && (
          <Box sx={{ display: "flex", gap: 2 }}>
            <Link component="button" onClick={onDownloadHandbook} sx={{ typography: "labelUppercase" }}>
              {actionLabels.downloadHandbook}
            </Link>
            <Link component="button" onClick={onContactCoordinator} sx={{ typography: "labelUppercase" }}>
              {actionLabels.contactCoordinator}
            </Link>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
