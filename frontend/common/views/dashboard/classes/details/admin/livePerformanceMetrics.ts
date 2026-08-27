import type { SvgIconComponent } from "@mui/icons-material";
import ChecklistIcon from "@mui/icons-material/Checklist";
import FavoriteIcon from "@mui/icons-material/Favorite";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import VisibilityIcon from "@mui/icons-material/Visibility";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { PerformanceMetric } from "@/frontend/common/views/dashboard/types/dashboard";

export interface LivePerformanceLabels {
  readonly livePerformanceOverview: string;
  readonly last30Mins: string;
  readonly engagementScore: string;
  readonly assessmentProgress: string;
  readonly focusLevel: string;
  readonly sessionHealth: string;
  readonly noData: string;
}

const METRIC_ICONS: Record<string, SvgIconComponent> = {
  engagement: TrendingUpIcon,
  assessment: ChecklistIcon,
  focus: VisibilityIcon,
  health: FavoriteIcon,
};

/**
 * Map raw live performance metrics to tier-agnostic metric items. The actual grid
 * rendering lives in tier composition files via Desktop/MobileMetricCardGrid.
 */
export function buildLivePerformanceMetricItems(
  metrics: readonly PerformanceMetric[],
  labels: Pick<LivePerformanceLabels, "engagementScore" | "assessmentProgress" | "focusLevel" | "sessionHealth">
): MetricItem[] {
  const labelMap: Record<string, string> = {
    engagementScore: labels.engagementScore,
    assessmentProgress: labels.assessmentProgress,
    focusLevel: labels.focusLevel,
    sessionHealth: labels.sessionHealth,
  };

  return metrics.map(m => ({
    key: m.key,
    count: m.value,
    labelKey: m.key,
    label: labelMap[m.labelKey] ?? m.labelKey,
    icon: METRIC_ICONS[m.key] ?? TrendingUpIcon,
    variant: "highlight",
  }));
}
