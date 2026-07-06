import type { SvgIconComponent } from "@mui/icons-material";
import {
  CalendarTodayOutlined,
  CheckCircleOutlined,
  EventBusyOutlined,
  EventOutlined,
  GroupsOutlined,
  SensorsOutlined,
  VerifiedOutlined,
} from "@mui/icons-material";
import type { TeacherDashboardMetrics } from "@/frontend/stores/teacherDashboardTypes";
import type { MetricItem } from "@/frontend/types/shared.types";
import type { TeacherDashboardLabels } from "../types/teacherDashboardLabels";

interface TeacherMetricDefinition {
  readonly key: string;
  readonly icon: SvgIconComponent;
  readonly variant?: MetricItem["variant"];
  readonly label: string;
  readonly count: (metrics: TeacherDashboardMetrics) => number;
}

function toMetricItems(
  definitions: readonly TeacherMetricDefinition[],
  metrics: TeacherDashboardMetrics
): MetricItem[] {
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
  metrics: TeacherDashboardMetrics,
  labels: TeacherDashboardLabels["activeMetrics"]
): MetricItem[] {
  const definitions: readonly TeacherMetricDefinition[] = [
    {
      key: "totalClasses",
      icon: CalendarTodayOutlined,
      label: labels.totalClasses,
      count: m => m.totalClasses,
    },
    {
      key: "activeSessions",
      icon: SensorsOutlined,
      label: labels.activeSessions,
      count: m => m.activeSessions ?? 0,
    },
    {
      key: "missedSlots",
      icon: EventBusyOutlined,
      label: labels.missedSlots,
      variant: "error",
      count: m => m.missedSlots,
    },
    {
      key: "completed",
      icon: VerifiedOutlined,
      label: labels.completed,
      count: m => m.completed,
    },
  ];

  return toMetricItems(definitions, metrics);
}

export function buildTeacherStandardMetricItems(
  metrics: TeacherDashboardMetrics,
  labels: TeacherDashboardLabels["metrics"]
): MetricItem[] {
  const definitions: readonly TeacherMetricDefinition[] = [
    {
      key: "totalClasses",
      icon: EventOutlined,
      label: labels.totalClasses,
      count: m => m.totalClasses,
    },
    {
      key: "missedSlots",
      icon: EventBusyOutlined,
      label: labels.missedSlots,
      variant: "error",
      count: m => m.missedSlots,
    },
    {
      key: "completed",
      icon: CheckCircleOutlined,
      label: labels.completed,
      variant: "highlight",
      count: m => m.completed,
    },
    {
      key: "studentsToday",
      icon: GroupsOutlined,
      label: labels.studentsToday,
      count: m => m.studentsToday,
    },
  ];

  return toMetricItems(definitions, metrics);
}
