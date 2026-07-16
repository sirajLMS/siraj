"use client";

import { AnalyticsOutlined, ErrorOutlined, HistoryOutlined, VerifiedOutlined } from "@mui/icons-material";
import { Grid } from "@mui/material";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import type { DstMigrationMetrics } from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import { useAppTranslation } from "@/shared/locale";

interface Props {
  readonly metrics: DstMigrationMetrics;
}

export function DstMigrationMetricsRow({ metrics }: Readonly<Props>) {
  const t = useAppTranslation().dashboardTranslations.dstMigration.metrics;

  return (
    <Grid container spacing={2} sx={{ mt: 4 }}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard label={t.totalAudited} value={metrics.totalAudited} icon={AnalyticsOutlined} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          label={t.successful}
          value={metrics.successful}
          icon={VerifiedOutlined}
          variant="highlight"
          animationIndex={1}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          label={t.conflicts}
          value={metrics.conflicts}
          icon={ErrorOutlined}
          variant="error"
          animationIndex={2}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard label={t.unchanged} value={metrics.unchanged} icon={HistoryOutlined} animationIndex={3} />
      </Grid>
    </Grid>
  );
}
