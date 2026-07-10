import { AdminPanelSettingsOutlined, BoltOutlined, GroupOutlined, WarningAmberOutlined } from "@mui/icons-material";
import { Grid } from "@mui/material";
import { useTranslations } from "next-intl";
import { MetricCard } from "@/frontend/components/ui";
import type { NonNullableManagerDirectoryMetrics } from "@/frontend/views/dashboard/managers/home/types";

interface ManagersMetricsProps {
  metrics: NonNullableManagerDirectoryMetrics;
}

export function ManagersMetrics({ metrics }: Readonly<ManagersMetricsProps>) {
  const t = useTranslations("dashboard.managersDirectory.metrics");

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 6, md: 3 }}>
        <MetricCard label={t("totalAdmin")} value={metrics.totalAdmin} icon={AdminPanelSettingsOutlined} />
      </Grid>
      <Grid size={{ xs: 6, md: 3 }}>
        <MetricCard label={t("systemStaff")} value={metrics.systemStaff} icon={GroupOutlined} />
      </Grid>
      <Grid size={{ xs: 6, md: 3 }}>
        <MetricCard label={t("activeNow")} value={metrics.activeNow} icon={BoltOutlined} variant="highlight" />
      </Grid>
      <Grid size={{ xs: 6, md: 3 }}>
        <MetricCard label={t("alerts")} value={metrics.alerts} icon={WarningAmberOutlined} variant="danger" />
      </Grid>
    </Grid>
  );
}
