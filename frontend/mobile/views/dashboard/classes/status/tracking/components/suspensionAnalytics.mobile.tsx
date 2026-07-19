"use client";

import { OpenInNewOutlined, WarningAmberOutlined } from "@mui/icons-material";
import { alpha, Box, Button, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type {
  SuspensionAnalyticsLabels,
  SuspensionAnalyticsProps,
} from "@/frontend/common/views/dashboard/classes/status/tracking/types";

const BAR_HEIGHTS: Array<{ pct: number; isHighlighted: boolean }> = [
  { pct: 40, isHighlighted: false },
  { pct: 55, isHighlighted: false },
  { pct: 30, isHighlighted: false },
  { pct: 85, isHighlighted: true },
  { pct: 45, isHighlighted: false },
  { pct: 20, isHighlighted: false },
  { pct: 10, isHighlighted: false },
];

const StyledChartPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.layout.radius.card,
  border: `1px solid ${theme.palette.border.light}`,
}));

const StyledChartTitle = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.titleLg.fontSize,
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

const StyledChartBar = styled(Box, {
  shouldForwardProp: prop => prop !== "isHighlighted",
})<{ isHighlighted: boolean }>(({ theme, isHighlighted }) => ({
  flex: 1,
  backgroundColor: isHighlighted ? theme.palette.error.main : theme.palette.primaryContainer,
  borderRadius: "3px 3px 0 0",
  transition: "height 0.3s ease",
}));

const StyledDayLabel = styled(Typography, {
  shouldForwardProp: prop => prop !== "isHighlighted",
})<{ isHighlighted: boolean }>(({ theme, isHighlighted }) => ({
  flex: 1,
  textAlign: "center",
  fontSize: theme.typography.labelUppercase.fontSize,
  fontFamily: theme.typography.fontFamily,
  fontWeight: isHighlighted ? 700 : 400,
  color: isHighlighted ? theme.palette.error.main : theme.palette.text.secondary,
}));

const StyledAnalyticsNote = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.bodyMd.fontSize,
  color: theme.palette.text.secondary,
}));

const StyledCtaContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: 3,
  backgroundColor: theme.palette.primary.dark,
  position: "relative",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  minHeight: 180,
}));

const StyledTopRightBlob = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: "-20%",
  right: "-15%",
  width: 160,
  height: 160,
  borderRadius: "50%",
  backgroundColor: alpha(theme.palette.primary.dark, 0.04),
  filter: "blur(40px)",
  pointerEvents: "none",
}));

const StyledBottomLeftBlob = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: "-10%",
  left: "-10%",
  width: 120,
  height: 120,
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
  fontFamily: theme.typography.fontFamily,
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
  fontFamily: theme.typography.fontFamily,
  fontWeight: 700,
  fontSize: theme.typography.bodyMd.fontSize,
  letterSpacing: "0.04em",
  alignSelf: "flex-start",
  paddingInline: theme.spacing(2.5),
  paddingBlock: theme.spacing(1.25),
  borderRadius: 2,
  "&:hover": {
    backgroundColor: theme.palette.primary.light,
  },
}));

function SuspensionAnalyticsChartMobile({ labels }: { readonly labels: SuspensionAnalyticsLabels }) {
  return (
    <StyledChartPaper elevation={0}>
      <StyledChartTitle variant="titleLg" sx={{ mb: 1.5 }}>
        {labels.suspensionAnalytics}
      </StyledChartTitle>

      <Box
        sx={{
          height: 120,
          display: "flex",
          alignItems: "flex-end",
          gap: 0.75,
          px: 0.5,
        }}
      >
        {BAR_HEIGHTS.map(({ pct, isHighlighted }, i) => (
          <StyledChartBar
            key={labels.days[i] ?? i}
            isHighlighted={isHighlighted}
            sx={{ height: `${pct}%` }}
            title={labels.days[i] ?? String(i)}
          />
        ))}
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", px: 0.5, mt: 1 }}>
        {labels.days.map((day, i) => (
          <StyledDayLabel key={day} variant="labelSm" isHighlighted={BAR_HEIGHTS[i]?.isHighlighted ?? false}>
            {day}
          </StyledDayLabel>
        ))}
      </Box>

      <StyledAnalyticsNote variant="bodyMd" sx={{ mt: 1.5 }}>
        {labels.analyticsNote}
      </StyledAnalyticsNote>
    </StyledChartPaper>
  );
}

function CtaMobile({ labels, suspendedCount, onOpenAuditLogs }: SuspensionAnalyticsProps) {
  return (
    <StyledCtaContainer>
      <StyledTopRightBlob />
      <StyledBottomLeftBlob />

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <StyledUrgentTaskBadge sx={{ mb: 1.5 }}>
          <StyledUrgentTaskIcon />
          <StyledUrgentTaskText>{labels.urgentTask}</StyledUrgentTaskText>
        </StyledUrgentTaskBadge>

        <StyledCtaHeadline sx={{ mb: 1 }}>{labels.accountsLocked(suspendedCount)}</StyledCtaHeadline>

        <StyledCtaDescription sx={{ mb: 2 }}>{labels.auditDescription}</StyledCtaDescription>
      </Box>

      <StyledOpenAuditLogsButton
        id="open-audit-logs-btn-mobile"
        variant="contained"
        startIcon={<OpenInNewOutlined sx={{ fontSize: 18 }} />}
        onClick={onOpenAuditLogs}
      >
        {labels.openAuditLogs}
      </StyledOpenAuditLogsButton>
    </StyledCtaContainer>
  );
}

export function SuspensionAnalyticsMobile({ labels, suspendedCount, onOpenAuditLogs }: SuspensionAnalyticsProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <SuspensionAnalyticsChartMobile labels={labels} />
      <CtaMobile labels={labels} suspendedCount={suspendedCount} onOpenAuditLogs={onOpenAuditLogs} />
    </Box>
  );
}
