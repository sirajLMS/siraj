"use client";

import { AccessTimeOutlined } from "@mui/icons-material";
import type { Breakpoint } from "@mui/material";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import type { GridSize } from "@mui/material/Grid";
import { MetricCardGrid } from "@/frontend/components/reports/MetricCardGrid";
import { SectionPanel } from "@/frontend/components/ui";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";

type ResponsiveStyleValue<T> = T | Array<T | null> | { [key in Breakpoint]?: T | null };

const DEFAULT_GRID_SIZE: ResponsiveStyleValue<GridSize> = { sm: 4, md: 4, lg: 2 };

interface DashboardMetricsSectionProps {
  readonly title: string;
  readonly lastUpdated: string;
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedMetricKey?: string;
  readonly gridSize?: ResponsiveStyleValue<GridSize>;
  readonly withSectionMargin?: boolean;
}

export function DashboardMetricsSection({
  title,
  lastUpdated,
  metrics,
  onMetricClick,
  selectedMetricKey,
  gridSize = DEFAULT_GRID_SIZE,
  withSectionMargin = false,
}: DashboardMetricsSectionProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const section = (
    <SectionPanel
      title={title}
      edgeToEdge={isMobile}
      actions={
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <AccessTimeOutlined sx={theme => ({ fontSize: 16, color: theme.palette.text.secondary })} />
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {lastUpdated}
          </Typography>
        </Box>
      }
    >
      <Box
        sx={{
          px: { xs: 0, md: 3 },
          py: { xs: 2, md: 2.5 },
        }}
      >
        <MetricCardGrid
          metrics={metrics}
          onMetricClick={onMetricClick}
          selectedKey={selectedMetricKey}
          layout={isMobile ? "scroll" : "grid"}
          size={gridSize}
        />
      </Box>
    </SectionPanel>
  );

  if (withSectionMargin) {
    return <Box sx={{ mb: { xs: 0, md: 4 } }}>{section}</Box>;
  }

  return section;
}
