"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, Link, Paper, Typography } from "@mui/material";
import type { ActivationPolicyPanelProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";

/**
 * Mobile variant of the activation policy panel.
 * Uses the compact layout by default (mobile shows a shorter description and
 * no inline action links — handlers are exposed for callers that want them
 * via the FAB/footer).
 *
 * Plan v5: per specs.md §3 N15 + §4.1 Class B, the byte-identical inline
 * `ActivationPolicyPanelMobileProps` interface was deleted; both tiers now
 * import the shared `ActivationPolicyPanelProps` declared once in
 * `frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps.ts`.
 */
export function ActivationPolicyPanelMobile({
  labels,
  compact = true,
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
