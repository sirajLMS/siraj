"use client";

import { AccessTimeOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { MetricCardGrid } from "@/frontend/components/reports/MetricCardGrid";
import { SectionPanel } from "@/frontend/components/ui";
import type { MetricItem } from "@/frontend/types/shared.types";

interface TeacherDashboardMetricsSectionProps {
  readonly title: string;
  readonly lastUpdated: string;
  readonly metrics: readonly MetricItem[];
}

export function TeacherDashboardMetricsSection({
  title,
  lastUpdated,
  metrics,
}: Readonly<TeacherDashboardMetricsSectionProps>) {
  return (
    <SectionPanel
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
      <Box sx={{ py: 2 }}>
        <MetricCardGrid metrics={metrics} layout="scroll" />
      </Box>
    </SectionPanel>
  );
}
