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
import type { AdminDashboardScheduleQuery_adminDashboardSchedule_AdminDashboardScheduleResult_metrics_DailyScheduleMetrics } from "@/frontend/graphql/generated/gql/operations";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";

type RawMetrics =
  | AdminDashboardScheduleQuery_adminDashboardSchedule_AdminDashboardScheduleResult_metrics_DailyScheduleMetrics
  | null
  | undefined;

interface AdminMetricDefinition {
  readonly key: string;
  readonly labelKey: string;
  readonly icon: SvgIconComponent;
  readonly variant?: MetricItem["variant"];
  readonly count: (metrics: RawMetrics) => number;
}

export const ADMIN_METRIC_DEFINITIONS: readonly AdminMetricDefinition[] = [
  { key: "total", labelKey: "dashboard.admin.metrics.total", icon: CalendarToday, count: m => m?.total ?? 0 },
  { key: "regular", labelKey: "dashboard.admin.metrics.regular", icon: FaceOutlined, count: m => m?.regular ?? 0 },
  { key: "trial", labelKey: "dashboard.admin.metrics.trial", icon: HeadphonesOutlined, count: m => m?.trial ?? 0 },
  {
    key: "advance",
    labelKey: "dashboard.admin.metrics.advance",
    icon: FastRewindOutlined,
    count: m => m?.advance ?? 0,
  },
  {
    key: "rescheduled",
    labelKey: "dashboard.admin.metrics.rescheduled",
    icon: EditNoteOutlined,
    count: m => m?.rescheduled ?? 0,
  },
  {
    key: "suspended",
    labelKey: "dashboard.admin.metrics.suspended",
    icon: ThumbDownOutlined,
    variant: "error",
    count: m => m?.suspended ?? 0,
  },
  {
    key: "taken",
    labelKey: "dashboard.admin.metrics.taken",
    icon: CheckCircleOutlineOutlined,
    count: m => m?.taken ?? 0,
  },
  {
    key: "pending",
    labelKey: "dashboard.admin.metrics.pending",
    icon: AccessTimeOutlined,
    count: m => m?.pending ?? 0,
  },
  {
    key: "activated",
    labelKey: "dashboard.admin.metrics.activated",
    icon: PowerSettingsNewOutlined,
    count: m => m?.activated ?? 0,
  },
  {
    key: "running",
    labelKey: "dashboard.admin.metrics.running",
    icon: PlayCircleOutlineOutlined,
    count: m => m?.running ?? 0,
  },
  {
    key: "absent",
    labelKey: "dashboard.admin.metrics.absent",
    icon: PersonRemoveOutlined,
    variant: "error",
    count: m => m?.absent ?? 0,
  },
  {
    key: "leave",
    labelKey: "dashboard.admin.metrics.leave",
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
