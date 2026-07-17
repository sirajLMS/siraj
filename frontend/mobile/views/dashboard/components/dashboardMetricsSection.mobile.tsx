"use client";

import { AccessTimeOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { GridSize } from "@mui/material/Grid";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui/card";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";

type ResponsiveStyleValue<T> = T | Array<T | null> | { [key in import("@mui/material").Breakpoint]?: T | null };

interface DashboardMetricsSectionMobileProps {
  readonly title: string;
  readonly lastUpdated: string;
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedMetricKey?: string;
  readonly withSectionMargin?: boolean;
  readonly gridSize?: ResponsiveStyleValue<GridSize>;
}

export function DashboardMetricsSectionMobile({
  title,
  lastUpdated,
  metrics,
  onMetricClick,
  selectedMetricKey,
  withSectionMargin = false,
  gridSize,
}: Readonly<DashboardMetricsSectionMobileProps>) {
  const section = (
    <MobileSectionPanel
      title={title}
      edgeToEdge
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
        <MobileMetricCardGrid
          metrics={metrics}
          onMetricClick={onMetricClick}
          selectedKey={selectedMetricKey}
          size={gridSize}
        />
      </Box>
    </MobileSectionPanel>
  );

  if (withSectionMargin) {
    return <Box sx={{ mb: { xs: 0, md: 4 } }}>{section}</Box>;
  }

  return section;
}
