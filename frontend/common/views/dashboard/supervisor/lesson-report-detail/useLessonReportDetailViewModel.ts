"use client";

import { useQuery } from "@apollo/client/react";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { lessonReportByIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import type { PendingReviewRow } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";
import { type PendingReviewsLabels, useAppTranslation } from "@/shared/locale";

export interface LessonReportDetailViewModel {
  readonly report: PendingReviewRow | null;
  readonly labels: PendingReviewsLabels;
  readonly pageTitle: string;
  readonly notFoundMessage: string;
  readonly loading: boolean;
  readonly error: Error | undefined;
}

export type UseLessonReportDetailViewModelProps = Record<string, never>;

export function useLessonReportDetailViewModel(
  _props: UseLessonReportDetailViewModelProps
): LessonReportDetailViewModel {
  const pendingLabels = useAppTranslation().dashboardTranslations.supervisorPortalPendingReviews;
  const lessonReportLabels = useAppTranslation().dashboardTranslations.lmsLessonReports;

  const params = useParams();
  const reportId = typeof params?.id === "string" ? params.id : "";

  useDocumentTitle(null, "dashboard.lmsLessonReports", "title");

  const { data, loading, error } = useQuery(lessonReportByIdQueryDocument, {
    variables: { reportId },
    skip: !reportId,
    fetchPolicy: "cache-and-network",
  });

  const report = useMemo((): PendingReviewRow | null => {
    const r = data?.lessonReportById;
    if (!r?.id) return null;
    return {
      id: r.id,
      classInstanceId: r.classInstanceId ?? "",
      studentId: r.studentId ?? "",
      studentName: r.studentName ?? "",
      teacherId: r.teacherId ?? "",
      teacherName: r.teacherName ?? "",
      subjectName: r.subjectName ?? "",
      classAvatarUrl: r.classAvatarUrl ?? null,
      lessonDate: r.lessonDate ?? "",
      durationMinutes: r.durationMinutes ?? 0,
      attendanceEvaluation: r.attendanceEvaluation ?? null,
      teacherNotes: r.teacherNotes ?? "",
      studentNotes: r.studentNotes ?? "",
      completionPercentage: r.completionPercentage ?? 0,
      status: r.status ?? null,
      submittedAt: r.submittedAt ?? "",
      reviewedAt: r.reviewedAt ?? "",
      rejectionReason: r.rejectionReason ?? "",
    };
  }, [data]);

  return {
    report,
    labels: pendingLabels,
    pageTitle: lessonReportLabels.title,
    notFoundMessage: lessonReportLabels.reportNotFound,
    loading,
    error,
  };
}
