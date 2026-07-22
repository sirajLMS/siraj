import type { SvgIconComponent } from "@mui/icons-material";
import { CalendarTodayOutlined, EventBusyOutlined, SensorsOutlined, VerifiedOutlined } from "@mui/icons-material";
import type { TeacherDashboardQuery_teacherDashboard_TeacherDashboard_metrics_TeacherDashboardMetrics } from "@/frontend/common/graphql/generated/gql/operations";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { TeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";

type RawMetrics =
  | TeacherDashboardQuery_teacherDashboard_TeacherDashboard_metrics_TeacherDashboardMetrics
  | null
  | undefined;

interface TeacherMetricDefinition {
  readonly key: string;
  readonly icon: SvgIconComponent;
  readonly variant?: MetricItem["variant"];
  readonly label: string;
  readonly count: (metrics: RawMetrics) => number;
}

function toMetricItems(definitions: readonly TeacherMetricDefinition[], metrics: RawMetrics): MetricItem[] {
  return definitions.map(definition => ({
    key: definition.key,
    label: definition.label,
    labelKey: definition.key,
    icon: definition.icon,
    variant: definition.variant,
    count: definition.count(metrics),
  }));
}

export function buildTeacherActiveMetricItems(
  metrics: RawMetrics,
  labels: TeacherDashboardLabels["activeMetrics"]
): MetricItem[] {
  const definitions: readonly TeacherMetricDefinition[] = [
    {
      key: "totalClasses",
      icon: CalendarTodayOutlined,
      label: labels.totalClasses,
      count: m => m?.total ?? 0,
    },
    {
      key: "activeSessions",
      icon: SensorsOutlined,
      label: labels.activeSessions,
      count: m => m?.running ?? 0,
    },
    {
      key: "missedSlots",
      icon: EventBusyOutlined,
      label: labels.missedSlots,
      variant: "error",
      count: m => m?.absent ?? 0,
    },
    {
      key: "completed",
      icon: VerifiedOutlined,
      label: labels.completed,
      count: m => m?.taken ?? 0,
    },
  ];

  return toMetricItems(definitions, metrics);
}
