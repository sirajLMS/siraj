import { LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { TeacherLessonReportsLabelsBySection } from "@/frontend/common/views/dashboard/teachers/lesson-reports/types/teacherLessonReports.types";
import type {
  TeacherLessonReportRow,
  TeacherLessonReportsViewModel,
} from "@/frontend/common/views/dashboard/teachers/lesson-reports/useTeacherLessonReportsViewModel";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";

const STATUS_LABEL_KEYS: Record<LessonReportStatus, "pendingReview" | "approved" | "rejected" | "draft"> = {
  [LessonReportStatus.PendingReview]: "pendingReview",
  [LessonReportStatus.Approved]: "approved",
  [LessonReportStatus.Rejected]: "rejected",
  [LessonReportStatus.Draft]: "draft",
};

const TEACHER_LESSON_REPORT_ROWS: readonly TeacherLessonReportRow[] = [
  {
    id: "report-1",
    classInstanceId: "class-1",
    lessonDate: "2026-02-02T10:00:00.000Z",
    durationMinutes: 60,
    completionPercentage: 80,
    status: LessonReportStatus.Approved,
    submittedAt: "2026-02-02T11:00:00.000Z",
    teacherNotes: "Covered grammar basics and reading aloud.",
    rejectionReason: null,
  },
  {
    id: "report-2",
    classInstanceId: "class-2",
    lessonDate: "2026-02-03T14:00:00.000Z",
    durationMinutes: 45,
    completionPercentage: 55,
    status: LessonReportStatus.PendingReview,
    submittedAt: "2026-02-03T15:00:00.000Z",
    teacherNotes: "Student needs more conversational practice.",
    rejectionReason: null,
  },
];

export function buildTeacherLessonReportsViewModel(
  locale: AppLocale,
  overrides: Partial<TeacherLessonReportsViewModel> = {}
): TeacherLessonReportsViewModel {
  const t = readTranslation(Translation.Dashboard.LmsLessonReports, locale);
  const labelsBySection: TeacherLessonReportsLabelsBySection = {
    shell: { title: t.historyTitle, emptyMessage: t.noReports },
    filters: { filterAll: t.filterAll, status: t.status },
    columns: {
      lessonDate: t.lessonDate,
      status: t.status,
      durationMinutes: t.durationMinutes,
      completionPercentage: t.completionPercentage,
      teacherNotes: t.teacherNotes,
    },
    cards: t,
  };
  return {
    rows: TEACHER_LESSON_REPORT_ROWS,
    loading: false,
    error: false,
    statusFilter: "ALL",
    statusOptions: [
      { value: "ALL", label: t.filterAll },
      { value: LessonReportStatus.PendingReview, label: t.pendingReview },
      { value: LessonReportStatus.Approved, label: t.approved },
      { value: LessonReportStatus.Rejected, label: t.rejected },
      { value: LessonReportStatus.Draft, label: t.draft },
    ],
    locale,
    labelsBySection,
    onStatusFilterChange: () => {},
    resolveStatusLabel: status => t[STATUS_LABEL_KEYS[status]],
    ...overrides,
  };
}
