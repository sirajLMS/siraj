import { CancelOutlined, CheckCircleOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import { useTranslations } from "next-intl";
import { MetricCard } from "@/frontend/components/ui/MetricCard";
import type { TeacherMetrics } from "@/frontend/stores/mockTeachersStore";

interface TeacherMetricsRowProps {
  readonly metrics: TeacherMetrics;
}

export function TeacherMetricsRow({ metrics }: Readonly<TeacherMetricsRowProps>) {
  const t = useTranslations("dashboard.teachersDirectory.metrics");

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: "gutter" }}>
      <MetricCard icon={CheckCircleOutlined} label={t("activated")} value={metrics.activated} variant="default" />
      <MetricCard icon={CancelOutlined} label={t("deactivated")} value={metrics.deactivated} variant="default" />
    </Box>
  );
}
