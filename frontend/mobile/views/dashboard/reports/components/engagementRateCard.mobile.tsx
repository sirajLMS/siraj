"use client";

import { TrendingUpOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/common/components/ui/card/BaseCard";

interface EngagementRateCardMobileProps {
  readonly rate: number;
  readonly growth: number | null;
  readonly title: string;
  readonly subtitle: string;
  readonly increaseLabel: string;
}

export function EngagementRateCardMobile({
  rate,
  growth,
  title,
  subtitle,
  increaseLabel,
}: Readonly<EngagementRateCardMobileProps>) {
  return (
    <BaseCard
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
        p: 2,
      }}
    >
      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 1 }}>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
          {title}
        </Typography>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {subtitle}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mt: 1 }}>
          <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main })}>
            {`${rate}%`}
          </Typography>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.primary.main, opacity: 0.7 })}>
            {growth !== null ? `+${growth}% vs prev` : increaseLabel}
          </Typography>
        </Box>
      </Box>
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
    </BaseCard>
  );
}
