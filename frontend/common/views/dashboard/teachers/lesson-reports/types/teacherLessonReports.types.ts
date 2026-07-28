import type { LessonReportLabels } from "@/shared/locale";

export interface TeacherLessonReportsShellLabels {
  readonly title: string;
  readonly emptyMessage: string;
}

export interface TeacherLessonReportsFilterLabels {
  readonly filterAll: string;
}

export interface TeacherLessonReportsLabelsBySection {
  readonly shell: TeacherLessonReportsShellLabels;
  readonly filters: TeacherLessonReportsFilterLabels;
  readonly cards: LessonReportLabels;
}
