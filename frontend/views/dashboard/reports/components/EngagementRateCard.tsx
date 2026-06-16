"use client";

import { TrendingUpOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/components/ui/BaseCard";

interface EngagementRateCardProps {
  readonly rate: number;
  readonly growth: number;
  readonly title: string;
  readonly subtitle: string;
  readonly increaseLabel: string;
  readonly compact?: boolean;
}

export function EngagementRateCard({
  rate,
  growth,
  title,
  subtitle,
  increaseLabel,
  compact = false,
}: Readonly<EngagementRateCardProps>) {
  return (
    <BaseCard
      sx={{
        display: "flex",
        flexDirection: compact ? "row" : "column",
        justifyContent: "space-between",
        gap: 2,
        minHeight: compact ? undefined : 180,
      }}
    >
      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 1 }}>
        {!compact && <TrendingUpOutlined sx={theme => ({ color: theme.palette.primary.main, fontSize: 32, mb: 1 })} />}
        <Typography variant="titleLg" sx={{ color: theme => theme.palette.primary.main }}>
          {title}
        </Typography>
        <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
          {subtitle}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mt: compact ? 1 : 2 }}>
          <Typography variant={compact ? "headlineMd" : "display"} sx={{ color: theme => theme.palette.primary.main }}>
            {compact ? `${rate}%` : `+${growth}%`}
          </Typography>
          <Typography variant="labelMd" sx={{ color: theme => theme.palette.primary.main, opacity: 0.7 }}>
            {compact ? `+${growth}% vs prev` : increaseLabel}
          </Typography>
        </Box>
      </Box>
      {compact && (
        <Box
          sx={theme => ({
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: `2px solid ${theme.palette.primary.main}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          })}
        >
          <TrendingUpOutlined sx={theme => ({ color: theme.palette.primary.main, fontSize: 28 })} />
        </Box>
      )}
    </BaseCard>
  );
}
