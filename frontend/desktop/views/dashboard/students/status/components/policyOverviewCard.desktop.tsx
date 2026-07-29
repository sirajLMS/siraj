"use client";

import { CheckCircleOutlined, GavelOutlined, InfoOutlined } from "@mui/icons-material";
import { Box, Divider, Paper, Typography } from "@mui/material";
import { useStudentStatusLabels } from "@/frontend/common/views/dashboard/students/status/useStudentStatusLabels";

function PolicyItem({ title, description }: Readonly<{ readonly title: string; readonly description: string }>) {
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <CheckCircleOutlined sx={theme => ({ color: theme.palette.primary.main, fontSize: 18 })} />
        <Typography
          variant="labelMd"
          sx={theme => ({
            fontWeight: 700,
            color: theme.palette.primary.main,
            textTransform: "uppercase",
          })}
        >
          {title}
        </Typography>
      </Box>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, pl: 3.5 })}>
        {description}
      </Typography>
    </Box>
  );
}

export function PolicyOverviewCardDesktop() {
  const t = useStudentStatusLabels();

  return (
    <Paper
      elevation={0}
      sx={theme => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: "xl",
        boxShadow: theme.palette.shadow.card,
        border: `1px solid ${theme.palette.border.main}`,
        overflow: "hidden",
        width: "100%",
        position: "relative",
      })}
    >
      <Box
        sx={theme => ({
          px: 3,
          py: 2.5,
          borderBottom: `1px solid ${theme.palette.border.main}`,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          backgroundColor: theme.palette.background.default,
        })}
      >
        <GavelOutlined sx={theme => ({ color: theme.palette.primary.main })} />
        <Typography
          variant="titleLg"
          sx={theme => ({
            color: theme.palette.primary.main,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          })}
        >
          {t.sections.policyOverview}
        </Typography>
      </Box>

      <Box sx={{ p: 3, position: "relative" }}>
        <Box
          sx={{
            position: "absolute",
            right: -16,
            bottom: -16,
            opacity: 0.05,
            transform: "rotate(-10deg)",
            pointerEvents: "none",
          }}
        >
          <InfoOutlined sx={{ fontSize: 120 }} />
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, position: "relative", zIndex: 1 }}>
          <PolicyItem title={t.policies.suspensionTitle} description={t.policies.suspensionDesc} />
          <Divider />
          <PolicyItem title={t.policies.onLeaveTitle} description={t.policies.onLeaveDesc} />
        </Box>
      </Box>
    </Paper>
  );
}

export function SuspensionWarningBannerDesktop() {
  const t = useStudentStatusLabels();

  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.errorContainer,
        borderRadius: "xl",
        p: 3,
        border: `1px solid ${theme.palette.error.main}`,
        borderLeft: `4px solid ${theme.palette.error.main}`,
        display: "flex",
        alignItems: "flex-start",
        gap: 2.5,
      })}
    >
      <Box
        sx={theme => ({
          backgroundColor: theme.palette.background.paper,
          borderRadius: "full",
          p: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.palette.error.main,
          boxShadow: theme.palette.shadow.card,
        })}
      >
        <InfoOutlined sx={{ fontSize: 32 }} />
      </Box>
      <Box>
        <Typography
          variant="titleLg"
          sx={theme => ({
            color: theme.palette.onErrorContainer,
            fontWeight: 700,
            mb: 0.5,
          })}
        >
          {t.warning.title}
        </Typography>
        <Typography
          variant="bodyMd"
          sx={theme => ({
            color: theme.palette.onErrorContainer,
            opacity: 0.9,
            lineHeight: 1.6,
          })}
        >
          {t.warning.description}
        </Typography>
      </Box>
    </Box>
  );
}
