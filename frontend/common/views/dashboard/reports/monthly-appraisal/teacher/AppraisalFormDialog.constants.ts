export interface AppraisalFormData {
  studentId: string;
  studentName: string;
  month: string;
  behaviorGrade: number | null;
  behaviorComment: string;
  attendanceGrade: number | null;
  attendanceComment: string;
  punctualityGrade: number | null;
  punctualityComment: string;
  overallGrade: number | null;
  overallComment: string;
  learningTargets: string;
}

export interface AppraisalInitialGrades {
  behaviorGrade: number | null;
  behaviorComment: string;
  attendanceGrade: number | null;
  attendanceComment: string;
  punctualityGrade: number | null;
  punctualityComment: string;
  overallGrade: number | null;
  overallComment: string;
  learningTargets: string;
}

export const RUBRIC_FIELDS = [
  { key: "behavior", labelKey: "behavior", gradeKey: "behaviorGrade", commentKey: "behaviorComment" },
  { key: "attendance", labelKey: "attendance", gradeKey: "attendanceGrade", commentKey: "attendanceComment" },
  { key: "punctuality", labelKey: "punctuality", gradeKey: "punctualityGrade", commentKey: "punctualityComment" },
  { key: "overall", labelKey: "overall", gradeKey: "overallGrade", commentKey: "overallComment" },
] as const;
