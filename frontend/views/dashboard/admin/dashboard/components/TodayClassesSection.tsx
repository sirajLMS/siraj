"use client";

import { AccessTimeOutlined } from "@mui/icons-material";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { MetricCardGrid } from "@/frontend/components/reports/MetricCardGrid";
import { SectionPanel } from "@/frontend/components/ui";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";

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
    <Box sx={{ mb: { xs: 0, md: 4 } }}>
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
            size={{ sm: 4, md: 4, lg: 2 }}
          />
        </Box>
      </SectionPanel>
    </Box>
  );
}
