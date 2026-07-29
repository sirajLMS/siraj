import { CancelOutlined, CheckCircleOutlined } from "@mui/icons-material";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import type { TeachersDirectoryLabels } from "@/shared/locale/types/dashboard/teachers/directory";

interface TeacherMetricsRowProps {
  readonly metrics:
    | {
        readonly activated?: number | null;
        readonly deactivated?: number | null;
      }
    | null
    | undefined;
  readonly labels: TeachersDirectoryLabels["metrics"];
}

export function TeacherMetricsRow({ metrics, labels }: Readonly<TeacherMetricsRowProps>) {
  const metricItems: MetricItem[] = [
    {
      key: "activated",
      count: metrics?.activated ?? 0,
      labelKey: "activated",
      label: labels.activated,
      icon: CheckCircleOutlined,
    },
    {
      key: "deactivated",
      count: metrics?.deactivated ?? 0,
      labelKey: "deactivated",
      label: labels.deactivated,
      icon: CancelOutlined,
    },
  ];

  return <DesktopMetricCardGrid metrics={metricItems} size={{ xs: 12, sm: 6 }} />;
}
