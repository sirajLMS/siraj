import type { ReactNode } from "react";
import { LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { formatDurationMinutes } from "@/frontend/common/views/dashboard/admin/home/utils/formatScheduleTime";
import type { PersonAccentTone } from "@/frontend/common/views/dashboard/admin/home/utils/scheduleCardHelpers";
import type { RecentApprovalCardLabels } from "@/frontend/common/views/dashboard/supervisor/dashboard/components/RecentApprovalCardList";
import type { RecentApproval } from "@/frontend/common/views/dashboard/supervisor/dashboard/types/supervisorDashboardTypes";

export interface MetaStatItem {
  readonly label: string;
  readonly value: ReactNode;
  readonly tone?: PersonAccentTone;
}

export function resolveApprovalStatusKey(status: LessonReportStatus | null): string {
  if (status === LessonReportStatus.Approved) {
    return "completed";
  }
  return "pending";
}

export function buildApprovalMetaItems(item: RecentApproval, labels: RecentApprovalCardLabels): MetaStatItem[] {
  const duration = formatDurationMinutes(item.durationMinutes);
  const completion = item.completionPercentage != null ? `${item.completionPercentage}%` : "—";

  return [
    { label: labels.lessonDate, value: item.lessonDate || "—", tone: "default" },
    { label: labels.duration, value: duration || "—", tone: "default" },
    { label: labels.completion, value: completion, tone: "default" },
  ];
}
