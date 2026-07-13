"use client";

import { OpenInNewOutlined, WarningAmberOutlined } from "@mui/icons-material";
import { alpha, Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { SuspensionAnalyticsChart } from "@/frontend/common/views/dashboard/classes/status/tracking/SuspensionAnalyticsChart";
import type { SuspensionAnalyticsProps } from "@/frontend/common/views/dashboard/classes/status/tracking/types";

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

const StyledUrgentTaskBadge = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.75),
  paddingInline: theme.spacing(1.5),
  paddingBlock: theme.spacing(0.5),
  backgroundColor: alpha(theme.palette.primaryContainer, 0.3),
  borderRadius: 10,
}));

const StyledUrgentTaskIcon = styled(WarningAmberOutlined)(({ theme }) => ({
  fontSize: 14,
  color: theme.palette.warning.main,
}));

const StyledUrgentTaskText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.labelUppercase.fontSize,
  fontWeight: 600,
  color: theme.palette.onPrimary,
}));

const StyledCtaHeadline = styled(Typography)(({ theme }) => ({
  fontFamily: '"Hanken Grotesk", sans-serif',
  fontSize: theme.typography.headlineMd.fontSize,
  fontWeight: 700,
  color: theme.palette.onPrimary,
  lineHeight: 1.2,
}));

const StyledCtaDescription = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.bodyMd.fontSize,
  color: theme.palette.onPrimary,
  opacity: 0.8,
}));

const StyledOpenAuditLogsButton = styled(Button)(({ theme }) => ({
  position: "relative",
  zIndex: 1,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  fontFamily: '"Inter", sans-serif',
  fontWeight: 700,
  fontSize: theme.typography.bodyMd.fontSize,
  letterSpacing: "0.04em",
  alignSelf: "flex-start",
  paddingInline: theme.spacing(3),
  paddingBlock: theme.spacing(1.25),
  borderRadius: 2,
  "&:hover": {
    backgroundColor: theme.palette.primary.light,
  },
}));

const Cta = ({ labels, suspendedCount, onOpenAuditLogs }: SuspensionAnalyticsProps) => {
  return (
    <StyledCtaContainer>
      <StyledTopRightBlob />
      <StyledBottomLeftBlob />

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
        onClick={onOpenAuditLogs}
      >
        {labels.openAuditLogs}
      </StyledOpenAuditLogsButton>
    </StyledCtaContainer>
  );
};

export function SuspensionAnalytics({ labels, suspendedCount, onOpenAuditLogs }: SuspensionAnalyticsProps) {
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

      <Cta labels={labels} suspendedCount={suspendedCount} onOpenAuditLogs={onOpenAuditLogs} />
    </Box>
  );
}
