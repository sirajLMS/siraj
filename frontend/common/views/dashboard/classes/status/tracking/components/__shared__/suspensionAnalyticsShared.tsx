"use client";

import { OpenInNewOutlined, WarningAmberOutlined } from "@mui/icons-material";
import { alpha, Box, Button, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { SuspensionAnalyticsTierConfig } from "@/frontend/common/views/dashboard/classes/status/tracking/components/__shared__/suspensionAnalyticsShared.types";
import type {
  SuspensionAnalyticsLabels,
  SuspensionAnalyticsProps,
} from "@/frontend/common/views/dashboard/classes/status/tracking/status-tracking.types";

const BAR_HEIGHTS: ReadonlyArray<{ readonly pct: number; readonly isHighlighted: boolean }> = [
  { pct: 40, isHighlighted: false },
  { pct: 55, isHighlighted: false },
  { pct: 30, isHighlighted: false },
  { pct: 85, isHighlighted: true },
  { pct: 45, isHighlighted: false },
  { pct: 20, isHighlighted: false },
  { pct: 10, isHighlighted: false },
];

export interface SuspensionAnalyticsScaffoldProps extends SuspensionAnalyticsProps {
  readonly tier: SuspensionAnalyticsTierConfig;
}

export function SuspensionAnalyticsScaffold({
  labels,
  suspendedCount,
  onOpenAuditLogs,
  tier,
}: Readonly<SuspensionAnalyticsScaffoldProps>) {
  return (
    <Box sx={tier.outerContainerSx}>
      <SuspensionAnalyticsChartShared labels={labels} tier={tier} />
      <SuspensionAnalyticsCtaShared
        labels={labels}
        suspendedCount={suspendedCount}
        onOpenAuditLogs={onOpenAuditLogs}
        tier={tier}
      />
    </Box>
  );
}

function SuspensionAnalyticsChartShared({
  labels,
  tier,
}: {
  readonly labels: SuspensionAnalyticsLabels;
  readonly tier: SuspensionAnalyticsTierConfig;
}) {
  return (
    <Paper
      elevation={0}
      sx={theme => ({
        p: theme.spacing(tier.chartPadding),
        borderRadius: theme.layout.radius.card,
        border: `1px solid ${theme.palette.border.light}`,
      })}
    >
      <Typography
        variant="titleLg"
        sx={theme => ({
          fontFamily: tier.chartTitleFontFamily || theme.typography.fontFamily,
          fontSize: theme.typography.titleLg.fontSize,
          fontWeight: 700,
          color: theme.palette.primary.main,
          mb: tier.chartTitleMb,
        })}
      >
        {labels.suspensionAnalytics}
      </Typography>

      <Box
        sx={{
          height: tier.chartHeight,
          display: "flex",
          alignItems: "flex-end",
          gap: tier.chartGap,
          px: tier.chartPx,
        }}
      >
        {BAR_HEIGHTS.map(({ pct, isHighlighted }, i) => (
          <ChartBar
            key={labels.days[i] ?? i}
            isHighlighted={isHighlighted}
            hasHover={tier.chartBarHover}
            sx={{ height: `${pct}%` }}
            title={labels.days[i] ?? String(i)}
          />
        ))}
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          px: tier.chartDayLabelRowPx,
          mt: tier.chartDayLabelRowMt,
        }}
      >
        {labels.days.map((day, i) => (
          <DayLabel
            key={day}
            isHighlighted={BAR_HEIGHTS[i]?.isHighlighted ?? false}
            fontFamily={tier.chartDayLabelFontFamily}
          >
            {day}
          </DayLabel>
        ))}
      </Box>

      <Typography
        variant="bodyMd"
        sx={theme => ({
          fontSize: theme.typography.bodyMd.fontSize,
          color: theme.palette.text.secondary,
          mt: tier.chartNoteMt,
        })}
      >
        {labels.analyticsNote}
      </Typography>
    </Paper>
  );
}

function CtaDecorativeBlobs({ tier }: { readonly tier: SuspensionAnalyticsTierConfig }) {
  return (
    <>
      <Box
        sx={theme => ({
          position: "absolute",
          top: "-20%",
          right: "-15%",
          width: tier.topRightBlobSize,
          height: tier.topRightBlobSize,
          borderRadius: "50%",
          backgroundColor: alpha(theme.palette.primary.dark, 0.04),
          filter: "blur(40px)",
          pointerEvents: "none",
        })}
      />
      <Box
        sx={theme => ({
          position: "absolute",
          bottom: "-10%",
          left: "-10%",
          width: tier.bottomLeftBlobSize,
          height: tier.bottomLeftBlobSize,
          borderRadius: "50%",
          backgroundColor: alpha(theme.palette.primary.main, 0.3),
          filter: "blur(32px)",
          pointerEvents: "none",
        })}
      />
    </>
  );
}

function CtaUrgentBadge({ label, mb }: { readonly label: string; readonly mb: number }) {
  return (
    <Box
      sx={theme => ({
        display: "inline-flex",
        alignItems: "center",
        gap: theme.spacing(0.75),
        paddingInline: theme.spacing(1.5),
        paddingBlock: theme.spacing(0.5),
        backgroundColor: alpha(theme.palette.primaryContainer, 0.3),
        borderRadius: theme.shape.borderRadius,
        mb,
      })}
    >
      <WarningAmberOutlined
        sx={theme => ({
          fontSize: theme.typography.bodyMd.fontSize,
          color: theme.palette.warning.main,
        })}
      />
      <Typography
        component="span"
        variant="labelUppercase"
        sx={theme => ({
          color: theme.palette.onPrimary,
        })}
      >
        {label}
      </Typography>
    </Box>
  );
}

function SuspensionAnalyticsCtaShared({
  labels,
  suspendedCount,
  onOpenAuditLogs,
  tier,
}: SuspensionAnalyticsProps & { readonly tier: SuspensionAnalyticsTierConfig }) {
  return (
    <Box
      sx={theme => ({
        p: theme.spacing(tier.ctaPadding),
        borderRadius: 3,
        backgroundColor: theme.palette.primary.dark,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: tier.ctaGap,
        minHeight: tier.ctaMinHeight,
      })}
    >
      <CtaDecorativeBlobs tier={tier} />

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <CtaUrgentBadge label={labels.urgentTask} mb={tier.urgentBadgeMb} />

        <Typography
          sx={theme => ({
            fontFamily: tier.ctaHeadlineFontFamily || theme.typography.fontFamily,
            fontSize: theme.typography.headlineMd.fontSize,
            fontWeight: 700,
            color: theme.palette.onPrimary,
            lineHeight: 1.2,
            mb: 1,
          })}
        >
          {labels.accountsLocked(suspendedCount)}
        </Typography>

        <Typography
          sx={theme => ({
            fontSize: theme.typography.bodyMd.fontSize,
            color: theme.palette.onPrimary,
            opacity: 0.8,
            mb: tier.ctaDescriptionMb,
          })}
        >
          {labels.auditDescription}
        </Typography>
      </Box>

      <Button
        id={tier.ctaButtonId}
        variant="contained"
        startIcon={<OpenInNewOutlined sx={{ fontSize: 18 }} />}
        onClick={onOpenAuditLogs}
        sx={theme => ({
          position: "relative",
          zIndex: 1,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.onPrimary,
          fontFamily: tier.ctaButtonFontFamily || theme.typography.fontFamily,
          fontWeight: 700,
          fontSize: theme.typography.bodyMd.fontSize,
          letterSpacing: "0.04em",
          alignSelf: "flex-start",
          paddingInline: theme.spacing(tier.ctaButtonPaddingInline),
          paddingBlock: theme.spacing(1.25),
          borderRadius: 2,
          "&:hover": {
            backgroundColor: theme.palette.primary.light,
          },
        })}
      >
        {labels.openAuditLogs}
      </Button>
    </Box>
  );
}

const ChartBar = styled(Box, {
  shouldForwardProp: prop => prop !== "isHighlighted" && prop !== "hasHover",
})<{ isHighlighted: boolean; hasHover: boolean }>(({ theme, isHighlighted, hasHover }) => ({
  flex: 1,
  backgroundColor: isHighlighted ? theme.palette.error.main : theme.palette.primaryContainer,
  borderRadius: "3px 3px 0 0",
  transition: theme.transitions.create("height", { duration: 300, easing: "ease" }),
  ...(hasHover ? { "&:hover": { opacity: 0.85 } } : {}),
}));

const DayLabel = styled(Box, {
  shouldForwardProp: prop => prop !== "isHighlighted",
})<{ isHighlighted: boolean; fontFamily: string }>(({ theme, isHighlighted, fontFamily }) => ({
  flex: 1,
  textAlign: "center",
  fontSize: theme.typography.labelUppercase.fontSize,
  fontFamily: fontFamily || theme.typography.fontFamily,
  fontWeight: isHighlighted ? 700 : 400,
  color: isHighlighted ? theme.palette.error.main : theme.palette.text.secondary,
}));
