"use client";

import { AccessTimeOutlined } from "@mui/icons-material";
import { Box, type SxProps, type Theme, Typography } from "@mui/material";
import type { GridSize } from "@mui/material/Grid";
import type { Breakpoint } from "@mui/material/styles";
import type { MetricItem } from "@/frontend/common/types/shared.types";

export type ResponsiveGridSize = GridSize | Array<GridSize | null> | { [key in Breakpoint]?: GridSize | null };

export interface DashboardMetricsSectionSharedOptions {
  readonly SectionPanel: React.ComponentType<{
    readonly title?: React.ReactNode;
    readonly actions?: React.ReactNode;
    readonly children?: React.ReactNode;
  }>;
  readonly renderMetricCardGrid: (params: {
    readonly metrics: readonly MetricItem[];
    readonly onMetricClick?: (key: string) => void;
    readonly selectedKey?: string;
    readonly gridSize?: ResponsiveGridSize;
  }) => React.ReactNode;
  readonly contentBoxSx?: SxProps<Theme>;
}

export interface DashboardMetricsSectionSharedProps {
  readonly title: string;
  readonly lastUpdated: string;
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedMetricKey?: string;
  readonly withSectionMargin?: boolean;
  readonly gridSize?: ResponsiveGridSize;
  readonly options: DashboardMetricsSectionSharedOptions;
}

export function DashboardMetricsSectionShared({
  title,
  lastUpdated,
  metrics,
  onMetricClick,
  selectedMetricKey,
  withSectionMargin = false,
  gridSize,
  options,
}: Readonly<DashboardMetricsSectionSharedProps>) {
  const { SectionPanel, renderMetricCardGrid, contentBoxSx } = options;

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
      <Box sx={contentBoxSx}>
        {renderMetricCardGrid({ metrics, onMetricClick, selectedKey: selectedMetricKey, gridSize })}
      </Box>
    </SectionPanel>
  );

  if (withSectionMargin) {
    return <Box sx={{ mb: { xs: 0, md: 4 } }}>{section}</Box>;
  }

  return section;
}
