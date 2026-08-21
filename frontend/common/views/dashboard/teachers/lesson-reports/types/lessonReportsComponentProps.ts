// NEW FOR PLAN v5 (newly created for the migration wave): Lifted the
// teachers-lesson-reports shared component-props interfaces from the
// byte-identical `(Mobile|Desktop)Props` pairs that previously lived inline
// in the tier files per specs.md §4.1 Class B (UNIFIED ORIGINAL). Both the
// mobile + desktop `teacherLessonReportsView.*` tier files import the single
// `LessonReportCardProps` declared here — no per-tier duplicate.

import type { LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  TeacherLessonReportRow,
  TeacherLessonReportsViewModel,
} from "@/frontend/common/views/dashboard/teachers/lesson-reports/useTeacherLessonReportsViewModel";
import type { useAppLocale } from "@/shared/locale";

// NEW FOR PLAN v5: LessonReportCardProps — byte-identical pair lifted from
// the mobile + desktop `teacherLessonReportsView.*` tier files. Both tier
// files previously declared `LessonReportCardMobileProps` /
// `LessonReportCardDesktopProps` with byte-identical bodies.
export interface LessonReportCardProps {
  readonly row: TeacherLessonReportRow;
  readonly labels: TeacherLessonReportsViewModel["labelsBySection"]["cards"];
  readonly locale: ReturnType<typeof useAppLocale>;
  readonly resolveStatusLabel: (status: LessonReportStatus) => string;
}
