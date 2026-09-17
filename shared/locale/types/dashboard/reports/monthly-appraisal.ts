/**
 * Monthly Appraisal locale labels (R1 — Monthly Appraisals).
 *
 * Consumed by:
 * - Teacher view (list + form) — `frontend/common/views/dashboard/reports/monthly-appraisal/`
 * - Student/Parent view (list + sparse detail + Add Feedback modal)
 *
 * RTL-safe: Arabic strings verified for bidirectional rendering. No hardcoded
 * strings anywhere in the appraisal UI — all text flows through these typed
 * translation functions.
 */
export interface MonthlyAppraisalLabels {
  readonly teacherView: {
    readonly pageTitle: string;
    readonly pageSubtitle: string;
    readonly selectStudent: string;
    readonly selectMonth: string;
    readonly noStudents: string;
    readonly openForm: string;
    readonly appraisalExists: string;
    readonly noAppraisalYet: string;
  };
  readonly form: {
    readonly title: string;
    readonly titleEdit: string;
    readonly student: string;
    readonly month: string;
    readonly rubric: {
      readonly behavior: string;
      readonly attendance: string;
      readonly punctuality: string;
      readonly overall: string;
      readonly grade: string;
      readonly comment: string;
      readonly gradePlaceholder: string;
      readonly commentPlaceholder: string;
      readonly gradeHint: string;
    };
    readonly learningTargets: string;
    readonly learningTargetsPlaceholder: string;
    readonly learningTargetsRequired: string;
    /** Caption under the dialog title summarizing grading rules. */
    readonly subtitle: string;
    readonly submit: string;
    readonly cancel: string;
    readonly successMessage: string;
  };
  readonly studentParentView: {
    readonly pageTitle: string;
    readonly pageSubtitle: string;
    readonly emptyState: string;
    readonly emptyStateDescription: string;
    readonly month: string;
    readonly teacher: string;
    readonly addFeedback: string;
    readonly feedbackModal: {
      readonly title: string;
      readonly bodyLabel: string;
      readonly bodyPlaceholder: string;
      readonly submit: string;
      readonly cancel: string;
      readonly successMessage: string;
      readonly bodyRequired: string;
    };
    readonly rubricLabels: {
      readonly behavior: string;
      readonly attendance: string;
      readonly punctuality: string;
      readonly overall: string;
    };
    readonly learningTargets: string;
    readonly feedbackThread: string;
    readonly noFeedback: string;
    readonly feedbackAuthor: string;
  };
  readonly errors: {
    readonly loadFailed: string;
    readonly submitFailed: string;
    readonly feedbackFailed: string;
    readonly gradeOutOfRange: string;
    readonly monthRequired: string;
    /** Form guard error when the student identifier is absent. */
    readonly studentIdMissing: string;
  };
}
