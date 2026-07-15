import { AdminPanelSettingsOutlined, BoltOutlined, GroupOutlined, WarningAmberOutlined } from "@mui/icons-material";
import { Grid } from "@mui/material";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import type { NonNullableManagerDirectoryMetrics } from "@/frontend/common/views/dashboard/managers/home/types";
import { useAppTranslation } from "@/shared/locale/client";

interface ManagersMetricsProps {
  metrics: NonNullableManagerDirectoryMetrics;
}

export function ManagersMetrics({ metrics }: Readonly<ManagersMetricsProps>) {
  const t = useAppTranslation("dashboard.managersDirectory").metrics;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 6, md: 3 }}>
        <MetricCard label={t.totalAdmin} value={metrics.totalAdmin} icon={AdminPanelSettingsOutlined} />
      </Grid>
      <Grid size={{ xs: 6, md: 3 }}>
        <MetricCard label={t.systemStaff} value={metrics.systemStaff} icon={GroupOutlined} />
      </Grid>
      <Grid size={{ xs: 6, md: 3 }}>
        <MetricCard label={t.activeNow} value={metrics.activeNow} icon={BoltOutlined} variant="highlight" />
      </Grid>
      <Grid size={{ xs: 6, md: 3 }}>
        <MetricCard label={t.alerts} value={metrics.alerts} icon={WarningAmberOutlined} variant="danger" />
      </Grid>
    </Grid>
  );
}
