import type { LessonReportLabels } from "@/shared/locale";

interface TeacherLessonReportsShellLabels {
  readonly title: string;
  readonly emptyMessage: string;
}

interface TeacherLessonReportsFilterLabels {
  readonly filterAll: string;
  readonly status: string;
}

interface TeacherLessonReportsColumnLabels {
  readonly lessonDate: string;
  readonly status: string;
  readonly durationMinutes: string;
  readonly completionPercentage: string;
  readonly teacherNotes: string;
}

export interface TeacherLessonReportsLabelsBySection {
  readonly shell: TeacherLessonReportsShellLabels;
  readonly filters: TeacherLessonReportsFilterLabels;
  readonly columns: TeacherLessonReportsColumnLabels;
  readonly cards: LessonReportLabels;
}
