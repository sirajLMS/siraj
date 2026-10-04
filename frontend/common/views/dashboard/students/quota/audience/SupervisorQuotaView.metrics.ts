import {
  ArchiveOutlined,
  CheckCircleOutlined,
  ClassOutlined,
  EventBusyOutlined,
  type SvgIconComponent,
} from "@mui/icons-material";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

const SUPERVISOR_QUOTA_METRIC_ICONS: Record<string, SvgIconComponent> = {
  totalClasses: ClassOutlined,
  active: CheckCircleOutlined,
  expired: EventBusyOutlined,
  archived: ArchiveOutlined,
};

export function buildSupervisorQuotaMetrics(params: {
  readonly t: StudentQuotaLabels;
  readonly totalCount: number;
  readonly activeCount: number;
  readonly expiredCount: number;
  readonly archivedCount: number;
}): MetricItem[] {
  const { t, totalCount, activeCount, expiredCount, archivedCount } = params;
  const counts: Record<string, number> = {
    totalClasses: totalCount,
    active: activeCount,
    expired: expiredCount,
    archived: archivedCount,
  };
  const labels: Record<string, string> = {
    totalClasses: t.audience.totalClasses,
    active: t.audience.statuses.ACTIVE,
    expired: t.audience.statuses.EXPIRED,
    archived: t.audience.statuses.ARCHIVED,
  };

  return Object.keys(labels).map(key => ({
    key,
    count: counts[key] ?? 0,
    labelKey: key,
    label: labels[key],
    icon: SUPERVISOR_QUOTA_METRIC_ICONS[key] ?? ClassOutlined,
    variant: key === "expired" ? "error" : "default",
  }));
}
