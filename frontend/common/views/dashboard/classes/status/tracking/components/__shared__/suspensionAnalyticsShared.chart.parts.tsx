import { Box, Paper, Typography } from "@mui/material";
import { SUSPENSION_ANALYTICS_BAR_HEIGHTS } from "@/frontend/common/views/dashboard/classes/status/tracking/components/__shared__/suspensionAnalyticsShared.constants";
import {
  SuspensionChartBar,
  SuspensionDayLabel,
} from "@/frontend/common/views/dashboard/classes/status/tracking/components/__shared__/suspensionAnalyticsShared.styled";
import type { SuspensionAnalyticsTierConfig } from "@/frontend/common/views/dashboard/classes/status/tracking/components/__shared__/suspensionAnalyticsShared.types";
import type { SuspensionAnalyticsLabels } from "@/frontend/common/views/dashboard/classes/status/tracking/status-tracking.types";

export function SuspensionAnalyticsChartShared({
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
        {SUSPENSION_ANALYTICS_BAR_HEIGHTS.map(({ pct, isHighlighted }, i) => (
          <SuspensionChartBar
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
          <SuspensionDayLabel
            key={day}
            isHighlighted={SUSPENSION_ANALYTICS_BAR_HEIGHTS[i]?.isHighlighted ?? false}
            fontFamily={tier.chartDayLabelFontFamily}
          >
            {day}
          </SuspensionDayLabel>
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
