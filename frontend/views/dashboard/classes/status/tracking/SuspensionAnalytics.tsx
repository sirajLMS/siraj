"use client";

import { OpenInNewOutlined, WarningAmberOutlined } from "@mui/icons-material";
import { alpha, Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
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

// Primary-dark flex column container used for the urgent CTA card
const StyledCtaContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 3,
  backgroundColor: theme.palette.primary.dark,
  position: "relative",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  minHeight: 220,
}));

// Decorative top-right blurred blob in the CTA background
const StyledTopRightBlob = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: "-20%",
  right: "-15%",
  width: 200,
  height: 200,
  borderRadius: "50%",
  backgroundColor: alpha(theme.palette.primary.dark, 0.04),
  filter: "blur(40px)",
  pointerEvents: "none",
}));

// Decorative bottom-left blurred blob in the CTA background
const StyledBottomLeftBlob = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: "-10%",
  left: "-10%",
  width: 160,
  height: 160,
  borderRadius: "50%",
  backgroundColor: alpha(theme.palette.primary.main, 0.3),
  filter: "blur(32px)",
  pointerEvents: "none",
}));

// Translucent primaryContainer pill marking the urgent-task header inside the CTA
const StyledUrgentTaskBadge = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.75),
  paddingInline: theme.spacing(1.5),
  paddingBlock: theme.spacing(0.5),
  backgroundColor: alpha(theme.palette.primaryContainer, 0.3),
  borderRadius: 10,
}));

// Warning-colored icon leading the urgent-task badge
const StyledUrgentTaskIcon = styled(WarningAmberOutlined)(({ theme }) => ({
  fontSize: 14,
  color: theme.palette.warning.main,
}));

// OnPrimary caption text inside the urgent-task badge
const StyledUrgentTaskText = styled(Typography)(({ theme }) => ({
  fontSize: "11px",
  fontWeight: 600,
  color: theme.palette.onPrimary,
}));

// Hanken Grotesk headline inside the CTA announcing the account-lock count
const StyledCtaHeadline = styled(Typography)(({ theme }) => ({
  fontFamily: '"Hanken Grotesk", sans-serif',
  fontSize: "24px",
  fontWeight: 700,
  color: theme.palette.onPrimary,
  lineHeight: 1.2,
}));

// OnPrimary body caption describing the audit action beneath the headline
const StyledCtaDescription = styled(Typography)(({ theme }) => ({
  fontSize: "14px",
  color: theme.palette.onPrimary,
  opacity: 0.8,
}));

// Primary-colored contained button that opens the audit logs
const StyledOpenAuditLogsButton = styled(Button)(({ theme }) => ({
  position: "relative",
  zIndex: 1,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  fontFamily: '"Inter", sans-serif',
  fontWeight: 700,
  fontSize: "13px",
  letterSpacing: "0.04em",
  alignSelf: "flex-start",
  paddingInline: theme.spacing(3),
  paddingBlock: theme.spacing(1.25),
  borderRadius: 2,
  "&:hover": {
    backgroundColor: theme.palette.primary.light,
  },
}));

const Cta = ({ labels, suspendedCount }: SuspensionAnalyticsProps) => {
  return (
    <StyledCtaContainer>
      {/* Background blobs */}
      <StyledTopRightBlob />
      <StyledBottomLeftBlob />

      {/* Content */}
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <StyledUrgentTaskBadge sx={{ mb: 2 }}>
          <StyledUrgentTaskIcon />
          <StyledUrgentTaskText>{labels.urgentTask}</StyledUrgentTaskText>
        </StyledUrgentTaskBadge>

        <StyledCtaHeadline sx={{ mb: 1 }}>
          {labels.accountsLocked.replace("{count}", String(suspendedCount))}
        </StyledCtaHeadline>

        <StyledCtaDescription sx={{ mb: 3 }}>{labels.auditDescription}</StyledCtaDescription>
      </Box>

      <StyledOpenAuditLogsButton
        id="open-audit-logs-btn"
        variant="contained"
        startIcon={<OpenInNewOutlined sx={{ fontSize: 18 }} />}
      >
        {labels.openAuditLogs}
      </StyledOpenAuditLogsButton>
    </StyledCtaContainer>
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
