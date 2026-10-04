import type {
  PendingLessonReportsQuery,
  PendingLessonReportsQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  PendingReviewRow,
  PendingReviewsSnackbarState,
} from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";

export const EMPTY_SNACKBAR: PendingReviewsSnackbarState = {
  open: false,
  message: "",
  severity: "success",
};

export function mapPendingReviewRows(data: PendingLessonReportsQuery | undefined): PendingReviewRow[] {
  const items = data?.pendingLessonReports?.rows ?? [];
  return items.map(r => ({
    id: r?.id ?? "",
    classInstanceId: r?.classInstanceId ?? "",
    studentId: r?.studentId ?? "",
    studentName: r?.studentName ?? "",
    teacherId: r?.teacherId ?? "",
    teacherName: r?.teacherName ?? "",
    subjectName: r?.subjectName ?? "",
    classAvatarUrl: r?.classAvatarUrl ?? null,
    teacherAvatarUrl: r?.teacherAvatarUrl ?? null,
    studentAvatarUrl: r?.studentAvatarUrl ?? null,
    teacherUserId: r?.teacherUserId ?? null,
    studentUserId: r?.studentUserId ?? null,
    lessonDate: r?.lessonDate ?? "",
    durationMinutes: r?.durationMinutes ?? 0,
    attendanceEvaluation: r?.attendanceEvaluation ?? null,
    teacherNotes: r?.teacherNotes ?? "",
    studentNotes: r?.studentNotes ?? "",
    completionPercentage: r?.completionPercentage ?? 0,
    status: r?.status ?? null,
    submittedAt: r?.submittedAt ?? "",
    reviewedAt: r?.reviewedAt ?? "",
    rejectionReason: r?.rejectionReason ?? "",
  }));
}

interface PendingReviewsQueryVariablesInput {
  readonly teacherId: string | null;
  readonly studentId: string | null;
  readonly page: number;
  readonly pageSize: number;
}

export function buildPendingReviewsQueryVariables({
  teacherId,
  studentId,
  page,
  pageSize,
}: PendingReviewsQueryVariablesInput): PendingLessonReportsQueryVariables {
  return {
    teacherId,
    studentId,
    paginationArgs: {
      first: pageSize,
      page: page + 1,
      after: null,
      before: null,
      last: null,
      maxCount: null,
      skip: null,
    },
  };
}
