// cspell:ignore: Hanken

"use client";

import { AccessTimeOutlined } from "@mui/icons-material";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { MetricCardGrid } from "@/frontend/components/reports/MetricCardGrid";
import { SectionPanel } from "@/frontend/components/ui";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import { TodayClassesMobileScroll } from "./TodayClassesMobileScroll";

interface TodayClassesSectionProps {
  readonly title: string;
  readonly lastUpdated: string;
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedMetricKey?: string;
}

export function TodayClassesSection({
  title,
  lastUpdated,
  metrics,
  onMetricClick,
  selectedMetricKey,
}: TodayClassesSectionProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box sx={{ mb: 4 }}>
      <SectionPanel
        title={title}
        actions={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <AccessTimeOutlined sx={theme => ({ fontSize: 16, color: theme.palette.text.secondary })} />
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {lastUpdated}
            </Typography>
          </Box>
        }
      >
        <Box sx={{ p: { xs: 2, lg: 0 } }}>
          {isMobile ? (
            <TodayClassesMobileScroll metrics={metrics} onMetricClick={onMetricClick} selectedKey={selectedMetricKey} />
          ) : (
            <MetricCardGrid metrics={metrics} onMetricClick={onMetricClick} selectedKey={selectedMetricKey} />
          )}
        </Box>
      </SectionPanel>
    </Box>
  );
}
