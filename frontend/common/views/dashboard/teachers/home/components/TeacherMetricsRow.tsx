import { CancelOutlined, CheckCircleOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import { useAppTranslation } from "@/shared/locale/client";

interface TeacherMetricsRowProps {
  readonly metrics:
    | {
        readonly activated?: number | null;
        readonly deactivated?: number | null;
      }
    | null
    | undefined;
}

export function TeacherMetricsRow({ metrics }: Readonly<TeacherMetricsRowProps>) {
  const t = useAppTranslation("dashboard.teachersDirectory").metrics;

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: "gutter" }}>
      <MetricCard icon={CheckCircleOutlined} label={t.activated} value={metrics?.activated ?? 0} variant="default" />
      <MetricCard icon={CancelOutlined} label={t.deactivated} value={metrics?.deactivated ?? 0} variant="default" />
    </Box>
  );
}
