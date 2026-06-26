"use client";

import { PaymentsOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { BaseCard } from "@/frontend/components/ui/BaseCard";

interface FinancialDistributionCardProps {
  readonly egpPercent: number;
  readonly usdPercent: number;
  readonly title: string;
  readonly subtitle: string;
  readonly egpLabel: string;
  readonly usdLabel: string;
  readonly compact?: boolean;
}

function DistributionLegend({
  egpPercent,
  usdPercent,
  egpLabel,
  usdLabel,
}: Readonly<Pick<FinancialDistributionCardProps, "egpPercent" | "usdPercent" | "egpLabel" | "usdLabel">>) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={theme => ({ width: 8, height: 8, borderRadius: "50%", backgroundColor: theme.palette.primary.main })}
        />
        <Typography variant="labelMd" sx={{ color: theme => theme.palette.text.primary }}>
          {egpPercent}% {egpLabel}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={theme => ({
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: theme.palette.secondaryContainer,
          })}
        />
        <Typography variant="labelMd" sx={{ color: theme => theme.palette.text.primary }}>
          {usdPercent}% {usdLabel}
        </Typography>
      </Box>
    </Box>
  );
}

export function FinancialDistributionCard({
  egpPercent,
  usdPercent,
  title,
  subtitle,
  egpLabel,
  usdLabel,
  compact = false,
}: Readonly<FinancialDistributionCardProps>) {
  return (
    <BaseCard>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="titleLg" sx={{ color: theme => theme.palette.primary.main }}>
            {title}
          </Typography>
          {!compact && (
            <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <PaymentsOutlined sx={theme => ({ color: theme.palette.primary.main })} />
      </Box>

      <Box
        sx={theme => ({
          width: "100%",
          height: compact ? 12 : 16,
          borderRadius: theme.layout.radius.badge,
          backgroundColor: theme.palette.surfaceContainerHigh,
          overflow: "hidden",
          display: "flex",
        })}
      >
        <Box sx={theme => ({ width: `${egpPercent}%`, backgroundColor: theme.palette.primary.main, height: "100%" })} />
        <Box
          sx={theme => ({ width: `${usdPercent}%`, backgroundColor: theme.palette.secondaryContainer, height: "100%" })}
        />
      </Box>

      <Box sx={{ mt: compact ? 1.5 : 2 }}>
        <DistributionLegend egpPercent={egpPercent} usdPercent={usdPercent} egpLabel={egpLabel} usdLabel={usdLabel} />
      </Box>
    </BaseCard>
  );
}
