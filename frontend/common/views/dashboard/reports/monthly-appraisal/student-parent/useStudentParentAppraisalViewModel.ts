"use client";

import type { MonthlyAppraisalLabels } from "@/shared/locale/types/dashboard/reports/monthly-appraisal";

/** A rubric field pair for sparse rendering (R1.3 — null fields omitted from display). */
export interface AppraisalRubricField {
  readonly label: string;
  readonly grade: number | null;
  readonly comment: string | null;
}

/** A feedback entry in the appraisal thread (R1.4). */
export interface AppraisalFeedbackEntry {
  readonly id: string;
  readonly body: string;
  readonly authorName: string | null;
  readonly createdAt: string;
}

/** A monthly appraisal row for the student/parent list view. */
export interface MonthlyAppraisalRow {
  readonly id: string;
  readonly month: string;
  readonly teacherId: string;
  readonly rubricFields: readonly AppraisalRubricField[];
  readonly learningTargets: string;
  readonly feedback: readonly AppraisalFeedbackEntry[];
}

export interface StudentParentAppraisalViewModel {
  readonly labels: MonthlyAppraisalLabels;
  readonly appraisals: readonly MonthlyAppraisalRow[];
  readonly loading: boolean;
  readonly error: boolean;
  readonly selectedAppraisalId: string | null;
  readonly onSelectAppraisal: (id: string | null) => void;
  readonly feedbackModalOpen: boolean;
  readonly onOpenFeedbackModal: () => void;
  readonly onCloseFeedbackModal: () => void;
  readonly onSubmitFeedback: (body: string) => void;
  readonly feedbackSubmitting: boolean;
  readonly feedbackError: string | null;
}
