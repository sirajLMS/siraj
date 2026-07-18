"use client";

import { TrendingUpOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/common/components/ui/card/BaseCard";
import type { EngagementRateCardProps } from "@/frontend/common/views/dashboard/reports/types/reportsViewProps";

export function EngagementRateCardDesktop({
  rate,
  growth,
  title,
  subtitle,
  increaseLabel,
}: Readonly<EngagementRateCardProps>) {
  let growthDisplay: string;
  if (growth === null) {
    growthDisplay = "—";
  } else {
    growthDisplay = `${growth > 0 ? "+" : ""}${growth}%`;
  }

  return (
    <BaseCard
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 2,
        minHeight: 180,
      }}
    >
      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 1 }}>
        <TrendingUpOutlined sx={theme => ({ color: theme.palette.primary.main, fontSize: 32, mb: 1 })} />
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
          {title}
        </Typography>
        <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
          {subtitle}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mt: 2 }}>
          <Typography variant="display" sx={theme => ({ color: theme.palette.primary.main })}>
            {growthDisplay}
          </Typography>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.primary.main, opacity: 0.7 })}>
            {increaseLabel}
          </Typography>
        </Box>
        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary, mt: 0.5 })}>
          {`${rate}%`}
        </Typography>
      </Box>
    </BaseCard>
  );
}
