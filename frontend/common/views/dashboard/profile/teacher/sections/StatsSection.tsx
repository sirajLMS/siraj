"use client";

import { ClassOutlined, TrendingUpOutlined } from "@mui/icons-material";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import {
  isTeacherAdminData,
  type TeacherProfileViewLabels,
  type TeacherViewData,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";

export const TEACHER_STATS_METRIC_KEYS = {
  totalClasses: "teacherTotalClasses",
  avgEngagement: "teacherAvgEngagement",
} as const;

type BuildTeacherStatsMetricsParams = {
  readonly labels: Pick<TeacherProfileViewLabels, "dashboard">;
  readonly teacherData: TeacherViewData;
  readonly isAdminScope: boolean;
};

/**
 * Builds the teacher stats metric descriptors consumed by tier metric grids
 * (DesktopMetricCardGrid / MobileMetricCardGrid). Rendering stays in the tier
 * views so no tier-specific primitive leaks into this shared module.
 */
export function buildTeacherStatsMetrics(params: BuildTeacherStatsMetricsParams): readonly MetricItem[] {
  const { labels, teacherData, isAdminScope } = params;
  const t = labels.dashboard.stats;

  const adminData = isTeacherAdminData(teacherData) ? teacherData : null;

  const metrics: MetricItem[] = [
    {
      key: TEACHER_STATS_METRIC_KEYS.totalClasses,
      labelKey: TEACHER_STATS_METRIC_KEYS.totalClasses,
      label: t.totalClasses,
      count: teacherData.totalClasses ?? 0,
      icon: ClassOutlined,
    },
  ];

  // avgEngagementScore is admin-scope data and must stay hidden for own/non-admin viewers.
  if (isAdminScope && adminData) {
    metrics.push({
      key: TEACHER_STATS_METRIC_KEYS.avgEngagement,
      labelKey: TEACHER_STATS_METRIC_KEYS.avgEngagement,
      label: t.avgEngagement,
      count: (adminData.avgEngagementScore ?? 0).toFixed(1),
      icon: TrendingUpOutlined,
    });
  }

  return metrics;
}
