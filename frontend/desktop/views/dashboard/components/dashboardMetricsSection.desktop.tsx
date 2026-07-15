"use client";

import { AccessTimeOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { GridSize } from "@mui/material/Grid";
import { MetricCardGrid } from "@/frontend/common/components/reports/MetricCardGrid";
import { SectionPanel } from "@/frontend/common/components/ui";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";

type ResponsiveStyleValue<T> = T | Array<T | null> | { [key in import("@mui/material").Breakpoint]?: T | null };

interface DashboardMetricsSectionDesktopProps {
  readonly title: string;
  readonly lastUpdated: string;
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedMetricKey?: string;
  readonly withSectionMargin?: boolean;
  readonly gridSize?: ResponsiveStyleValue<GridSize>;
}

export function DashboardMetricsSectionDesktop({
  title,
  lastUpdated,
  metrics,
  onMetricClick,
  selectedMetricKey,
  withSectionMargin = false,
  gridSize,
}: Readonly<DashboardMetricsSectionDesktopProps>) {
  const section = (
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
