import type {
  StudentAppraisalDetailForFormQuery_studentMonthlyAppraisals,
  SubmitMonthlyAppraisalInput,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  AppraisalFormData,
  AppraisalInitialGrades,
} from "@/frontend/common/views/dashboard/reports/monthly-appraisal/teacher/AppraisalFormDialog.constants";

/**
 * Builds the dialog's initial form state, preferring the caller-supplied
 * grades and falling back to the student's latest persisted appraisal.
 */
export function buildInitialFormData(params: {
  readonly studentId: string;
  readonly studentName: string;
  readonly month: string;
  readonly initialGrades: AppraisalInitialGrades | null | undefined;
  readonly existingAppraisal: StudentAppraisalDetailForFormQuery_studentMonthlyAppraisals | null | undefined;
}): AppraisalFormData {
  const { studentId, studentName, month, initialGrades, existingAppraisal } = params;
  return {
    studentId,
    studentName,
    month,
    behaviorGrade: initialGrades?.behaviorGrade ?? existingAppraisal?.behaviorGrade ?? null,
    behaviorComment: initialGrades?.behaviorComment ?? existingAppraisal?.behaviorComment ?? "",
    attendanceGrade: initialGrades?.attendanceGrade ?? existingAppraisal?.attendanceGrade ?? null,
    attendanceComment: initialGrades?.attendanceComment ?? existingAppraisal?.attendanceComment ?? "",
    punctualityGrade: initialGrades?.punctualityGrade ?? existingAppraisal?.punctualityGrade ?? null,
    punctualityComment: initialGrades?.punctualityComment ?? existingAppraisal?.punctualityComment ?? "",
    overallGrade: initialGrades?.overallGrade ?? existingAppraisal?.overallGrade ?? null,
    overallComment: initialGrades?.overallComment ?? existingAppraisal?.overallComment ?? "",
    learningTargets: initialGrades?.learningTargets ?? existingAppraisal?.learningTargets ?? "",
  };
}

/**
 * Maps the dialog's form state to the submit-monthly-appraisal mutation
 * input, sending empty comments as null.
 */
export function buildSubmitAppraisalInput(
  formData: AppraisalFormData,
  studentId: string,
  month: string
): SubmitMonthlyAppraisalInput {
  return {
    studentId,
    month,
    behaviorGrade: formData.behaviorGrade,
    behaviorComment: formData.behaviorComment || null,
    attendanceGrade: formData.attendanceGrade,
    attendanceComment: formData.attendanceComment || null,
    punctualityGrade: formData.punctualityGrade,
    punctualityComment: formData.punctualityComment || null,
    overallGrade: formData.overallGrade,
    overallComment: formData.overallComment || null,
    learningTargets: formData.learningTargets,
  };
}
