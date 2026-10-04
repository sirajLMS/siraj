import type {
  AppraisalFeedbackEntry,
  AppraisalRubricField,
  MonthlyAppraisalRow,
  StudentParentAppraisalViewModel,
} from "@/frontend/common/views/dashboard/reports/monthly-appraisal/student-parent/useStudentParentAppraisalViewModel";

/** Shared shape of an appraisal returned by either myMonthlyAppraisal or studentMonthlyAppraisals queries. */
export type AppraisalQueryResult = {
  id: string | null;
  month: string | null;
  teacherId: string | null;
  behaviorGrade: number | null;
  behaviorComment: string | null;
  attendanceGrade: number | null;
  attendanceComment: string | null;
  punctualityGrade: number | null;
  punctualityComment: string | null;
  overallGrade: number | null;
  overallComment: string | null;
  learningTargets: string | null;
  feedback: ReadonlyArray<{
    id: string | null;
    body: string | null;
    authorName: string | null;
    createdAt: string | null;
  }> | null;
};

function extractRubricFields(
  a: {
    behaviorGrade: number | null;
    behaviorComment: string | null;
    attendanceGrade: number | null;
    attendanceComment: string | null;
    punctualityGrade: number | null;
    punctualityComment: string | null;
    overallGrade: number | null;
    overallComment: string | null;
  },
  labels: StudentParentAppraisalViewModel["labels"]
): readonly AppraisalRubricField[] {
  const fields: AppraisalRubricField[] = [
    { label: labels.studentParentView.rubricLabels.behavior, grade: a.behaviorGrade, comment: a.behaviorComment },
    { label: labels.studentParentView.rubricLabels.attendance, grade: a.attendanceGrade, comment: a.attendanceComment },
    {
      label: labels.studentParentView.rubricLabels.punctuality,
      grade: a.punctualityGrade,
      comment: a.punctualityComment,
    },
    { label: labels.studentParentView.rubricLabels.overall, grade: a.overallGrade, comment: a.overallComment },
  ];
  return fields.filter(f => f.grade !== null || (f.comment !== null && f.comment !== ""));
}

function mapFeedback(
  feedback:
    | ReadonlyArray<{
        id: string | null;
        body: string | null;
        authorName: string | null;
        createdAt: string | null;
      }>
    | null
    | undefined
): readonly AppraisalFeedbackEntry[] {
  if (!feedback) return [];
  return feedback.map(f => ({
    id: f.id ?? "",
    body: f.body ?? "",
    authorName: f.authorName,
    createdAt: f.createdAt ?? "",
  }));
}

function mapAppraisal(a: AppraisalQueryResult, labels: StudentParentAppraisalViewModel["labels"]): MonthlyAppraisalRow {
  return {
    id: a.id ?? "",
    month: a.month ?? "",
    teacherId: a.teacherId ?? "",
    rubricFields: extractRubricFields(a, labels),
    learningTargets: a.learningTargets ?? "",
    feedback: mapFeedback(a.feedback),
  };
}

export function buildStudentSelfAppraisals(
  data: AppraisalQueryResult | null | undefined,
  labels: StudentParentAppraisalViewModel["labels"]
): readonly MonthlyAppraisalRow[] {
  if (!data) return [];
  return [mapAppraisal(data, labels)];
}

export function buildParentChildAppraisals(
  data: ReadonlyArray<AppraisalQueryResult> | null | undefined,
  labels: StudentParentAppraisalViewModel["labels"]
): readonly MonthlyAppraisalRow[] {
  if (!data) return [];
  return data.map(a => mapAppraisal(a, labels));
}
