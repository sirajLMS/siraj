import EventAvailableOutlined from "@mui/icons-material/EventAvailableOutlined";
import GradeOutlined from "@mui/icons-material/GradeOutlined";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import type { MetricItem } from "@/frontend/common/types/shared.types";

export interface PerformanceOverviewLabels {
  readonly previousPerformanceOverview: string;
  readonly attendanceRate: string;
  readonly avgGrade: string;
  readonly lastClass: string;
  readonly days: string;
  readonly noData: string;
}

export interface PerformanceOverviewMetricsInput {
  readonly attendanceRate: number;
  readonly avgGrade: string;
  readonly lastClassDaysAgo: number;
  readonly labels: Pick<PerformanceOverviewLabels, "attendanceRate" | "avgGrade" | "lastClass" | "days">;
}

/**
 * Build the performance stat set as tier-agnostic metric items. The actual grid
 * rendering lives in tier composition files via Desktop/MobileMetricCardGrid.
 */
export function buildPerformanceOverviewMetrics({
  attendanceRate,
  avgGrade,
  lastClassDaysAgo,
  labels,
}: PerformanceOverviewMetricsInput): MetricItem[] {
  return [
    {
      key: "attendanceRate",
      count: `${attendanceRate}%`,
      labelKey: "attendanceRate",
      label: labels.attendanceRate,
      icon: EventAvailableOutlined,
      variant: "highlight",
    },
    {
      key: "avgGrade",
      count: avgGrade,
      labelKey: "avgGrade",
      label: labels.avgGrade,
      icon: GradeOutlined,
      variant: "highlight",
    },
    {
      key: "lastClass",
      count: `${lastClassDaysAgo} ${labels.days}`,
      labelKey: "lastClass",
      label: labels.lastClass,
      icon: HistoryOutlined,
      variant: "highlight",
    },
  ];
}
