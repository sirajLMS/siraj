import { OpenInNewOutlined } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import {
  CtaDecorativeBlobs,
  CtaUrgentBadge,
} from "@/frontend/common/views/dashboard/classes/status/tracking/components/__shared__/suspensionAnalyticsShared.cta.parts";
import type { SuspensionAnalyticsTierConfig } from "@/frontend/common/views/dashboard/classes/status/tracking/components/__shared__/suspensionAnalyticsShared.types";
import type { SuspensionAnalyticsProps } from "@/frontend/common/views/dashboard/classes/status/tracking/status-tracking.types";

export function SuspensionAnalyticsCtaShared({
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
