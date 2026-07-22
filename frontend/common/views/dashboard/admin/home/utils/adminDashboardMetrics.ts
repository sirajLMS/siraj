import type { SvgIconComponent } from "@mui/icons-material";
import {
  AccessTimeOutlined,
  CalendarToday,
  CheckCircleOutlineOutlined,
  EditNoteOutlined,
  ExitToAppOutlined,
  FaceOutlined,
  FastRewindOutlined,
  HeadphonesOutlined,
  PersonRemoveOutlined,
  PlayCircleOutlineOutlined,
  PowerSettingsNewOutlined,
  ThumbDownOutlined,
} from "@mui/icons-material";
import type { AdminDashboardScheduleQuery_adminDashboardSchedule_AdminDashboardScheduleResult_metrics_DailyScheduleMetrics } from "@/frontend/common/graphql/generated/gql/operations";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { AdminDashboardLabels } from "@/shared/locale";

export type RawMetrics =
  | AdminDashboardScheduleQuery_adminDashboardSchedule_AdminDashboardScheduleResult_metrics_DailyScheduleMetrics
  | null
  | undefined;

interface AdminMetricDefinition {
  readonly key: string;
  readonly labelKey: keyof AdminDashboardLabels["metrics"];
  readonly icon: SvgIconComponent;
  readonly variant?: MetricItem["variant"];
  readonly count: (metrics: RawMetrics) => number;
}

export const ADMIN_METRIC_DEFINITIONS: readonly AdminMetricDefinition[] = [
  { key: "total", labelKey: "total", icon: CalendarToday, count: m => m?.total ?? 0 },
  { key: "regular", labelKey: "regular", icon: FaceOutlined, count: m => m?.regular ?? 0 },
  { key: "trial", labelKey: "trial", icon: HeadphonesOutlined, count: m => m?.trial ?? 0 },
  {
    key: "advance",
    labelKey: "advance",
    icon: FastRewindOutlined,
    count: m => m?.advance ?? 0,
  },
  {
    key: "rescheduled",
    labelKey: "rescheduled",
    icon: EditNoteOutlined,
    count: m => m?.rescheduled ?? 0,
  },
  {
    key: "suspended",
    labelKey: "suspended",
    icon: ThumbDownOutlined,
    variant: "error",
    count: m => m?.suspended ?? 0,
  },
  {
    key: "taken",
    labelKey: "taken",
    icon: CheckCircleOutlineOutlined,
    count: m => m?.taken ?? 0,
  },
  {
    key: "pending",
    labelKey: "pending",
    icon: AccessTimeOutlined,
    count: m => m?.pending ?? 0,
  },
  {
    key: "activated",
    labelKey: "activated",
    icon: PowerSettingsNewOutlined,
    count: m => m?.activated ?? 0,
  },
  {
    key: "running",
    labelKey: "running",
    icon: PlayCircleOutlineOutlined,
    count: m => m?.running ?? 0,
  },
  {
    key: "absent",
    labelKey: "absent",
    icon: PersonRemoveOutlined,
    variant: "error",
    count: m => m?.absent ?? 0,
  },
  {
    key: "leave",
    labelKey: "leave",
    icon: ExitToAppOutlined,
    variant: "error",
    count: m => m?.leave ?? 0,
  },
];

export function buildAdminDashboardMetrics(rawMetrics: RawMetrics): MetricItem[] {
  return ADMIN_METRIC_DEFINITIONS.map(definition => ({
    key: definition.key,
    count: definition.count(rawMetrics),
    labelKey: definition.labelKey,
    icon: definition.icon,
    variant: definition.variant,
  }));
}
