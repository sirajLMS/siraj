"use client";

import { AnalyticsOutlined, ErrorOutlined, HistoryOutlined, VerifiedOutlined } from "@mui/icons-material";
import { Box, Stack } from "@mui/material";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import type { DstMigrationMetrics } from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import { useAppTranslation } from "@/shared/locale";

interface Props {
  readonly metrics: DstMigrationMetrics;
}

export function DstMigrationMetricsRowMobile({ metrics }: Readonly<Props>) {
  const t = useAppTranslation().dashboardTranslations.dstMigration.metrics;

  return (
    <Stack spacing={1.5} sx={{ width: "100%" }}>
      <MetricCard label={t.totalAudited} value={metrics.totalAudited} icon={AnalyticsOutlined} />
      <MetricCard
        label={t.successful}
        value={metrics.successful}
        icon={VerifiedOutlined}
        variant="highlight"
        animationIndex={1}
      />
      <MetricCard
        label={t.conflicts}
        value={metrics.conflicts}
        icon={ErrorOutlined}
        variant="error"
        animationIndex={2}
      />
      <Box>
        <MetricCard label={t.unchanged} value={metrics.unchanged} icon={HistoryOutlined} animationIndex={3} />
      </Box>
    </Stack>
  );
}
