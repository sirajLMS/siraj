import { AdminPanelSettingsOutlined, BoltOutlined, GroupOutlined, WarningAmberOutlined } from "@mui/icons-material";
import { Grid } from "@mui/material";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import type { NonNullableManagerDirectoryMetrics } from "@/frontend/common/views/dashboard/staff/home/types";
import type { StaffDirectoryLabels } from "@/shared/locale";

interface ManagersMetricsProps {
  readonly labels: StaffDirectoryLabels["metrics"];
  metrics: NonNullableManagerDirectoryMetrics;
}

export function ManagersMetrics({ labels: t, metrics }: Readonly<ManagersMetricsProps>) {
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
