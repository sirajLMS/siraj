// cspell:ignore: Hanken

"use client";

import { AccessTimeOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { MetricCardGrid } from "@/frontend/components/reports/MetricCardGrid";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";

interface TodayClassesSectionProps {
  readonly title: string;
  readonly lastUpdated: string;
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
}

export function TodayClassesSection({ title, lastUpdated, metrics, onMetricClick }: TodayClassesSectionProps) {
  return (
    <Box sx={{ mb: 4 }}>
      {/* Section Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography
          variant="headlineMd"
          sx={theme => ({
            color: theme.palette.text.primary,
            fontFamily: '"Hanken Grotesk", sans-serif',
            fontWeight: 600,
          })}
        >
          {title}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <AccessTimeOutlined
            sx={theme => ({
              fontSize: 16,
              color: theme.palette.text.secondary,
            })}
          />
          <Typography
            sx={theme => ({
              fontFamily: '"Inter", sans-serif',
              fontSize: "12px",
              color: theme.palette.text.secondary,
              fontWeight: 400,
            })}
          >
            {lastUpdated}
          </Typography>
        </Box>
      </Box>

      {/* Metric Cards Grid */}
      <MetricCardGrid metrics={metrics} onMetricClick={onMetricClick} />
    </Box>
  );
}
