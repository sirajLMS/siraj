import { CancelOutlined, CheckCircleOutlined } from "@mui/icons-material";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { useAppTranslation } from "@/shared/locale";

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
  const t = useAppTranslation().dashboardTranslations.teachersDirectory.metrics;

  const metricItems: MetricItem[] = [
    {
      key: "activated",
      count: metrics?.activated ?? 0,
      labelKey: "activated",
      label: t.activated,
      icon: CheckCircleOutlined,
    },
    {
      key: "deactivated",
      count: metrics?.deactivated ?? 0,
      labelKey: "deactivated",
      label: t.deactivated,
      icon: CancelOutlined,
    },
  ];

  return <DesktopMetricCardGrid metrics={metricItems} size={{ xs: 12, sm: 6 }} />;
}
