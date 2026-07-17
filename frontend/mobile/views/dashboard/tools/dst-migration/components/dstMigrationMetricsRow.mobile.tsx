"use client";

import { AnalyticsOutlined, ErrorOutlined, HistoryOutlined, VerifiedOutlined } from "@mui/icons-material";
import { Box, Stack } from "@mui/material";
import type { DstMigrationMetrics } from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import { MobileMetricCard } from "@/frontend/mobile/components/ui/card/MetricCard";
import { useAppTranslation } from "@/shared/locale";

interface Props {
  readonly metrics: DstMigrationMetrics;
}

export function DstMigrationMetricsRowMobile({ metrics }: Readonly<Props>) {
  const t = useAppTranslation().dashboardTranslations.dstMigration.metrics;

  return (
    <Stack spacing={1.5} sx={{ width: "100%" }}>
      <MobileMetricCard label={t.totalAudited} value={metrics.totalAudited} icon={AnalyticsOutlined} />
      <MobileMetricCard
        label={t.successful}
        value={metrics.successful}
        icon={VerifiedOutlined}
        variant="highlight"
        animationIndex={1}
      />
      <MobileMetricCard
        label={t.conflicts}
        value={metrics.conflicts}
        icon={ErrorOutlined}
        variant="error"
        animationIndex={2}
      />
      <Box>
        <MobileMetricCard label={t.unchanged} value={metrics.unchanged} icon={HistoryOutlined} animationIndex={3} />
      </Box>
    </Stack>
  );
}
