"use client";

import { PaymentsOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { CurrencyDistributionSlice } from "@/frontend/common/views/dashboard/reports/types/reportsTypes";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";

interface FinancialDistributionCardMobileProps {
  readonly currencyDistribution: readonly CurrencyDistributionSlice[];
  readonly title: string;
  readonly subtitle: string;
}

const SEGMENT_COLORS: readonly ((theme: Theme) => string)[] = [
  theme => theme.palette.primary.main,
  theme => theme.palette.secondaryContainer,
  theme => theme.palette.tertiary ?? theme.palette.info.main,
  theme => theme.palette.warning.main,
];

function DistributionLegend({
  currencyDistribution,
}: Readonly<{ currencyDistribution: readonly CurrencyDistributionSlice[] }>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
      {currencyDistribution.map((slice, index) => (
        <Box key={slice.currency} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={theme => ({
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length](theme),
            })}
          />
          <Typography variant="labelMd" sx={{ color: theme => theme.palette.text.primary }}>
            {slice.formattedAmount
              ? `${slice.percent}% ${slice.label} · ${slice.formattedAmount}`
              : `${slice.percent}% ${slice.label}`}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export function FinancialDistributionCardMobile({
  currencyDistribution,
  title,
  subtitle,
}: Readonly<FinancialDistributionCardMobileProps>) {
  const hasDistribution = currencyDistribution.length > 0;

  return (
    <MobileBaseCard sx={{ p: 2 }}>
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

      <Box
        sx={theme => ({
          width: "100%",
          height: 12,
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
                backgroundColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length](theme),
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

      <Box sx={{ mt: 1.5 }}>
        {hasDistribution ? (
          <DistributionLegend currencyDistribution={currencyDistribution} />
        ) : (
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
            —
          </Typography>
        )}
      </Box>
    </MobileBaseCard>
  );
}
