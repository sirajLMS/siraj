import type { RecentApprovalCardLabels } from "@/frontend/common/views/dashboard/supervisor/dashboard/components/RecentApprovalCardList";
import type { SupervisorDashboardViewModel } from "@/frontend/common/views/dashboard/supervisor/dashboard/useSupervisorDashboardViewModel";

export function buildRecentApprovalCardLabels(
  labels: SupervisorDashboardViewModel["labels"]
): RecentApprovalCardLabels {
  return {
    approvedTime: labels.approvedTime,
    lessonDate: labels.lessonDate,
    duration: labels.duration,
    completion: labels.completion,
    teacher: labels.teacher,
    student: labels.student,
    viewReport: labels.viewReport,
    viewClass: labels.viewClass,
    history: labels.history,
    approvedStatus: labels.approvedStatus,
  };
}
