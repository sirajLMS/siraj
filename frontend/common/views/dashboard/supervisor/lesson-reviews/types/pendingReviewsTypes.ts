import type { AttendanceEvaluation, LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { PendingReviewsLabels } from "@/shared/locale";

export interface PendingReviewRow {
  readonly id: string;
  readonly classInstanceId: string;
  readonly studentId: string;
  readonly teacherId: string;
  readonly lessonDate: string;
  readonly durationMinutes: number;
  readonly attendanceEvaluation: AttendanceEvaluation | null;
  readonly teacherNotes: string;
  readonly studentNotes: string;
  readonly completionPercentage: number;
  readonly status: LessonReportStatus | null;
  readonly submittedAt: string;
  readonly reviewedAt: string;
  readonly rejectionReason: string;
}

export interface PendingReviewsViewModel {
  readonly rows: readonly PendingReviewRow[];
  readonly selectedReport: PendingReviewRow | null;
  readonly rejectDialogOpen: boolean;
  readonly rejectReason: string;
  readonly teacherFilter: string;
  readonly studentFilter: string;
  readonly loading: boolean;
  readonly approving: boolean;
  readonly rejecting: boolean;
  readonly labels: PendingReviewsLabels;
  readonly onTeacherFilterChange: (value: string) => void;
  readonly onStudentFilterChange: (value: string) => void;
  readonly onSelectReport: (report: PendingReviewRow | null) => void;
  readonly onApprove: (reportId: string) => void;
  readonly onOpenRejectDialog: (report: PendingReviewRow) => void;
  readonly onCloseRejectDialog: () => void;
  readonly onRejectReasonChange: (value: string) => void;
  readonly onConfirmReject: () => void;
}

export type UsePendingReviewsViewModelProps = PendingReviewsViewModel;
