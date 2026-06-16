"use client";

import { OpenInNewOutlined, WarningAmberOutlined } from "@mui/icons-material";
import { alpha, Box, Button, Typography } from "@mui/material";
import { SuspensionAnalyticsChart } from "./SuspensionAnalyticsChart";

export interface SuspensionAnalyticsLabels {
  readonly suspensionAnalytics: string;
  readonly analyticsNote: string;
  readonly urgentTask: string;
  readonly accountsLocked: string;
  readonly auditDescription: string;
  readonly openAuditLogs: string;
  readonly suspended: string;
  readonly days: readonly string[];
}

export interface SuspensionAnalyticsProps {
  readonly suspendedCount: number;
  readonly labels: SuspensionAnalyticsLabels;
}

const Cta = ({ labels, suspendedCount }: SuspensionAnalyticsProps) => {
  return (
    <Box
      sx={theme => ({
        p: 3,
        borderRadius: 3,
        bgcolor: theme.palette.primary.dark,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: 220,
      })}
    >
      {/* Background blobs */}
      <Box
        sx={theme => ({
          position: "absolute",
          top: "-20%",
          right: "-15%",
          width: 200,
          height: 200,
          borderRadius: "50%",
          bgcolor: alpha(theme.palette.primary.dark, 0.04),
          filter: "blur(40px)",
          pointerEvents: "none",
        })}
      />
      <Box
        sx={theme => ({
          position: "absolute",
          bottom: "-10%",
          left: "-10%",
          width: 160,
          height: 160,
          borderRadius: "50%",
          bgcolor: alpha(theme.palette.primary.main, 0.3),
          filter: "blur(32px)",
          pointerEvents: "none",
        })}
      />

      {/* Content */}
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={theme => ({
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            px: 1.5,
            py: 0.5,
            bgcolor: alpha(theme.palette.primaryContainer, 0.3),
            borderRadius: 10,
            mb: 2,
          })}
        >
          <WarningAmberOutlined sx={theme => ({ fontSize: 14, color: theme.palette.warning.main })} />
          <Typography sx={theme => ({ fontSize: "11px", fontWeight: 600, color: theme.palette.onPrimary })}>
            {labels.urgentTask}
          </Typography>
        </Box>

        <Typography
          sx={theme => ({
            fontFamily: '"Hanken Grotesk", sans-serif',
            fontSize: "24px",
            fontWeight: 700,
            color: theme.palette.onPrimary,
            lineHeight: 1.2,
            mb: 1,
          })}
        >
          {labels.accountsLocked.replace("{count}", String(suspendedCount))}
        </Typography>

        <Typography sx={theme => ({ fontSize: "14px", color: theme.palette.onPrimary, opacity: 0.8, mb: 3 })}>
          {labels.auditDescription}
        </Typography>
      </Box>

      <Button
        id="open-audit-logs-btn"
        variant="contained"
        startIcon={<OpenInNewOutlined sx={{ fontSize: 18 }} />}
        sx={theme => ({
          position: "relative",
          zIndex: 1,
          bgcolor: theme.palette.primary.main,
          color: theme.palette.onPrimary,
          fontFamily: '"Inter", sans-serif',
          fontWeight: 700,
          fontSize: "13px",
          letterSpacing: "0.04em",
          alignSelf: "flex-start",
          px: 3,
          py: 1.25,
          borderRadius: 2,
          "&:hover": {
            bgcolor: theme.palette.primary.light,
          },
        })}
      >
        {labels.openAuditLogs}
      </Button>
    </Box>
  );
};

export function SuspensionAnalytics({ labels, suspendedCount }: SuspensionAnalyticsProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
        gap: 3,
        mt: 3,
      }}
    >
      <SuspensionAnalyticsChart labels={labels} />

      {/* Urgent CTA card */}
      <Cta labels={labels} suspendedCount={suspendedCount} />
    </Box>
  );
}
