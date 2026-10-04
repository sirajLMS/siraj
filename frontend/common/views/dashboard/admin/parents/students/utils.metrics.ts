import {
  CancelOutlined,
  EventBusyOutlined,
  type SvgIconComponent,
  TimerOutlined,
  VerifiedUserOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { StudentAccountStatus } from "@/frontend/common/views/dashboard/admin/parents/students/types";
import type { StudentDirectoryLabels } from "@/shared/locale";

export const METRIC_DEFINITIONS = [
  { key: "deactivated" as const, icon: CancelOutlined },
  { key: "regular" as const, icon: VerifiedUserOutlined },
  { key: "on_leave" as const, icon: EventBusyOutlined },
  { key: "suspended" as const, icon: WarningAmberOutlined },
  { key: "on_trial" as const, icon: TimerOutlined },
];

type StudentMetricKey = keyof StudentDirectoryLabels["metrics"];

function getMetricTranslationKey(key: StudentAccountStatus): StudentMetricKey {
  if (key === "on_leave") return "onLeave";
  if (key === "on_trial") return "onTrial";
  return key;
}

export function toMetricItem(
  key: StudentAccountStatus,
  count: number,
  icon: SvgIconComponent,
  t: StudentDirectoryLabels
): MetricItem {
  const metricKey = getMetricTranslationKey(key);
  return {
    key,
    count,
    labelKey: key,
    label: t.metrics[metricKey],
    icon,
    variant: key === "suspended" ? ("error" as const) : undefined,
  };
}
