import type { Theme } from "@mui/material/styles";
import { LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { LessonReportLabels } from "@/shared/locale/types/dashboard/lms/lessonReports";

export type LessonReportStatusLabelSlice = Pick<
  LessonReportLabels,
  "approved" | "pendingReview" | "rejected" | "draft"
>;

export function resolveLessonReportStatusLabel(
  status: LessonReportStatus | null,
  labels: LessonReportStatusLabelSlice
): string {
  if (!status) {
    return labels.pendingReview;
  }

  switch (status) {
    case LessonReportStatus.Approved:
      return labels.approved;
    case LessonReportStatus.Rejected:
      return labels.rejected;
    case LessonReportStatus.Draft:
      return labels.draft;
    case LessonReportStatus.PendingReview:
      return labels.pendingReview;
    default:
      return status;
  }
}

export function lessonReportStatusSessionKey(status: LessonReportStatus | null): string {
  if (status === LessonReportStatus.Approved) {
    return "completed";
  }
  if (status === LessonReportStatus.Rejected) {
    return "blocked";
  }
  return "pending";
}

export function formatRecentLessonReportDuration(durationMinutes: number): string {
  return `${durationMinutes} min`;
}

export function clampCompletionPercentage(completionPercentage: number): number {
  return Math.min(100, Math.max(0, completionPercentage));
}

export function resolveCompletionProgressColor(theme: Theme, completionPercentage: number): string {
  const value = clampCompletionPercentage(completionPercentage);

  if (value < 50) {
    return theme.palette.error.main;
  }
  if (value < 80) {
    return theme.palette.warning.main;
  }
  return theme.palette.success.main;
}
