"use client";

import { PaymentsOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { CurrencyDistributionSlice } from "@/frontend/common/views/dashboard/reports/types/reportsTypes";

/**
 * Shared scaffold for the financial distribution card.
 *
 * Desktop and mobile variants differ only in:
 *   - outer card wrapper (BaseCard vs MobileBaseCard)
 *   - bar height (16 vs 12)
 *   - legend layout (row vs column)
 *   - margin-top of the legend section (2 vs 1.5)
 *
 * This scaffold extracts the segment-colour array, the legend, and the
 * distribution bar so both tiers render the same shared pieces.
 */

const SEGMENT_COLORS: readonly ((theme: Theme) => string)[] = [
  theme => theme.palette.primary.main,
  theme => theme.palette.secondaryContainer,
  theme => theme.palette.tertiary ?? theme.palette.info.main,
  theme => theme.palette.warning.main,
];

function getSegmentColor(index: number, theme: Theme): string {
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length](theme);
}

function DistributionLegend({
  currencyDistribution,
  direction = "row",
}: Readonly<{ currencyDistribution: readonly CurrencyDistributionSlice[]; direction?: "row" | "column" }>) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: direction === "column" ? "column" : "row",
        justifyContent: "space-between",
        gap: direction === "column" ? 1 : 2,
        flexWrap: "wrap",
      }}
    >
      {currencyDistribution.map((slice, index) => (
        <Box key={slice.currency} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={theme => ({
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: getSegmentColor(index, theme),
            })}
          />
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.primary })}>
            {slice.formattedAmount
              ? `${slice.percent}% ${slice.label} · ${slice.formattedAmount}`
              : `${slice.percent}% ${slice.label}`}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function DistributionBar({
  currencyDistribution,
  height = 16,
}: Readonly<{ currencyDistribution: readonly CurrencyDistributionSlice[]; height?: number }>) {
  const hasDistribution = currencyDistribution.length > 0;

  return (
    <Box
      sx={theme => ({
        width: "100%",
        height,
        borderRadius: theme.layout.radius.badge,
        backgroundColor: theme.palette.surfaceContainerHigh,
        overflow: "hidden",
        display: "flex",
      })}
    >
      {hasDistribution ? (
        currencyDistribution.map((slice, index) => (
          <Box
            key={slice.currency}
            sx={theme => ({
              width: `${slice.percent}%`,
              backgroundColor: getSegmentColor(index, theme),
              height: "100%",
            })}
          />
        ))
      ) : (
        <Box
          sx={theme => ({ width: "100%", backgroundColor: theme.palette.surfaceContainerHighest, height: "100%" })}
        />
      )}
    </Box>
  );
}

export function FinancialDistributionCardContent({
  currencyDistribution,
  title,
  subtitle,
  barHeight = 16,
  legendDirection = "row",
  legendMt = 2,
}: Readonly<{
  currencyDistribution: readonly CurrencyDistributionSlice[];
  title: string;
  subtitle: string;
  barHeight?: number;
  legendDirection?: "row" | "column";
  legendMt?: number;
}>) {
  const hasDistribution = currencyDistribution.length > 0;
  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
            {title}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, mt: 0.5 })}>
            {subtitle}
          </Typography>
        </Box>
        <PaymentsOutlined sx={theme => ({ color: theme.palette.primary.main })} />
      </Box>

      <DistributionBar currencyDistribution={currencyDistribution} height={barHeight} />

      <Box sx={{ mt: legendMt }}>
        {hasDistribution ? (
          <DistributionLegend currencyDistribution={currencyDistribution} direction={legendDirection} />
        ) : (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            —
          </Typography>
        )}
      </Box>
    </>
  );
}
