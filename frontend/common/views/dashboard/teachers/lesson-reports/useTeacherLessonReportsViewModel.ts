"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import { LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { PendingLessonReportsQuery } from "@/frontend/common/graphql/generated/gql/operations";
import { pendingLessonReportsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/classes/lesson-report.documents";
import type { TeacherLessonReportsLabelsBySection } from "@/frontend/common/views/dashboard/teachers/lesson-reports/types/teacherLessonReports.types";
import { type LessonReportLabels, Translation, useAppLocale, useAppTranslation } from "@/shared/locale";

type LessonReportStatusValue = `${LessonReportStatus}`;
export type StatusFilterValue = "ALL" | LessonReportStatusValue;

export interface TeacherLessonReportRow {
  readonly id: string | null;
  readonly classInstanceId: string | null;
  readonly lessonDate: string | null;
  readonly durationMinutes: number | null;
  readonly completionPercentage: number | null;
  readonly status: LessonReportStatus | null;
  readonly submittedAt: string | null;
  readonly teacherNotes: string | null;
  readonly rejectionReason: string | null;
}

export interface TeacherLessonReportStatusOption {
  readonly value: StatusFilterValue;
  readonly label: string;
}

export interface TeacherLessonReportsViewModel {
  readonly rows: readonly TeacherLessonReportRow[];
  readonly loading: boolean;
  readonly error: boolean;
  readonly statusFilter: StatusFilterValue;
  readonly statusOptions: readonly TeacherLessonReportStatusOption[];
  readonly locale: ReturnType<typeof useAppLocale>;
  readonly labelsBySection: TeacherLessonReportsLabelsBySection;
  readonly onStatusFilterChange: (value: StatusFilterValue) => void;
  readonly resolveStatusLabel: (status: LessonReportStatus) => string;
}

export interface UseTeacherLessonReportsViewModelProps {
  readonly teacherId: string;
}

type PendingLessonReportsRow = NonNullable<
  NonNullable<NonNullable<PendingLessonReportsQuery["pendingLessonReports"]>["rows"]>[number]
>;

const STATUS_OPTION_KEYS: readonly StatusFilterValue[] = [
  "ALL",
  LessonReportStatus.PendingReview,
  LessonReportStatus.Approved,
  LessonReportStatus.Rejected,
  LessonReportStatus.Draft,
];

export function useTeacherLessonReportsViewModel({
  teacherId,
}: Readonly<UseTeacherLessonReportsViewModelProps>): TeacherLessonReportsViewModel {
  const t = useAppTranslation(Translation.Dashboard.LmsLessonReports);
  const locale = useAppLocale();
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("ALL");

  const { data, loading, error } = useQuery(pendingLessonReportsQueryDocument, {
    variables: { teacherId, studentId: null, paginationArgs: null },
    fetchPolicy: "cache-and-network",
  });

  const statusOptions = useMemo<readonly TeacherLessonReportStatusOption[]>(
    () =>
      STATUS_OPTION_KEYS.map(value => ({
        value,
        label: value === "ALL" ? t.filterAll : resolveStatusLabel(value as LessonReportStatus, t),
      })),
    [t]
  );

  const rows = useMemo<readonly TeacherLessonReportRow[]>(() => {
    const source = data?.pendingLessonReports?.rows ?? [];
    if (statusFilter === "ALL") {
      return source.map(toRow);
    }
    const target = statusFilter as LessonReportStatus;
    return source.filter(row => row?.status === target).map(toRow);
  }, [data, statusFilter]);

  return {
    rows,
    loading,
    error: Boolean(error),
    statusFilter,
    statusOptions,
    locale,
    labelsBySection: {
      shell: {
        title: t.historyTitle,
        emptyMessage: t.noReports,
      },
      filters: {
        filterAll: t.filterAll,
      },
      cards: t,
    },
    onStatusFilterChange: setStatusFilter,
    resolveStatusLabel: status => resolveStatusLabel(status, t),
  };
}

function resolveStatusLabel(status: LessonReportStatus, labels: LessonReportLabels): string {
  switch (status) {
    case LessonReportStatus.PendingReview:
      return labels.pendingReview;
    case LessonReportStatus.Approved:
      return labels.approved;
    case LessonReportStatus.Rejected:
      return labels.rejected;
    case LessonReportStatus.Draft:
      return labels.draft;
    default:
      return status;
  }
}

function toRow(row: PendingLessonReportsRow): TeacherLessonReportRow {
  return {
    id: row?.id ?? null,
    classInstanceId: row?.classInstanceId ?? null,
    lessonDate: row?.lessonDate ?? null,
    durationMinutes: row?.durationMinutes ?? null,
    completionPercentage: row?.completionPercentage ?? null,
    status: row?.status ?? null,
    submittedAt: row?.submittedAt ?? null,
    teacherNotes: row?.teacherNotes ?? null,
    rejectionReason: row?.rejectionReason ?? null,
  };
}
