import type { appraisalFeedback, monthlyAppraisals } from "@/backend/db/schema";

/**
 * Monthly Appraisal — canonical type definitions.
 *
 * Foundation types via Drizzle's `$inferSelect` / `$inferInsert`. Return types
 * extend the select shape with optional joined properties (feedback array,
 * author name). Input types omit fields resolved by the service layer
 * (auth context, timestamps, primary key).
 *
 * Design (F1 — Monthly Appraisals):
 * - `month` is stored as a first-of-month timestamp (normalized by the service
 *   layer before insert) so the unique key `(studentId, teacherId, month)`
 *   stays stable across saves.
 * - Grade columns are nullable `integer` (range 1..5 enforced by the
 *   service layer; sparse rubric — null fields are omitted from the UI per R1.3).
 * - `learningTargets` is the only required rubric field (R1.1).
 * - `appraisalFeedback` is an append-only child table (R1.4 feedback loop);
 *   each row carries `authorUserId` resolved from auth context at the service layer.
 */

export type MonthlyAppraisalSelectType = typeof monthlyAppraisals.$inferSelect;
type AppraisalFeedbackSelectType = typeof appraisalFeedback.$inferSelect;

/**
 * Sparse-field rubric payload submitted by a teacher. Carries no identity
 * fields: `teacherId` is resolved from auth context in the service layer and
 * never trusted from client input. `month` is normalized to the first day of
 * its month by the service before reaching the repo.
 */
export type MonthlyAppraisalSubmitInput = {
  studentId: string;
  month: Date;
  behaviorGrade?: number | null;
  behaviorComment?: string | null;
  attendanceGrade?: number | null;
  attendanceComment?: string | null;
  punctualityGrade?: number | null;
  punctualityComment?: string | null;
  overallGrade?: number | null;
  overallComment?: string | null;
  learningTargets: string;
};

/**
 * Repo-facing upsert payload: the submitted rubric plus the verified
 * `teacherId` resolved from auth context at the service layer.
 */
export type MonthlyAppraisalUpsertInput = MonthlyAppraisalSubmitInput & {
  teacherId: string;
};

/**
 * Feedback append payload. Carries no identity fields: `authorUserId` is
 * resolved from auth context in the service layer.
 */
export type AppraisalFeedbackInput = {
  appraisalId: string;
  body: string;
};

/**
 * Repo-facing feedback payload: the submitted feedback plus the verified
 * `authorUserId` resolved from auth context at the service layer.
 */
export type AppraisalFeedbackAppendInput = AppraisalFeedbackInput & {
  authorUserId: string;
};

/**
 * Author-name-bearing feedback return type. `authorName` is joined from
 * `users.name` at the repo layer for display without leaking `authorUserId`
 * directly to the GraphQL surface (the service may further restrict).
 */
export type AppraisalFeedbackReturnType = AppraisalFeedbackSelectType & {
  authorName?: string | null;
};

/**
 * Canonical monthly-appraisal return type — sparse rubric fields remain
 * present (null included) so the UI can decide which to render (R1.3); the
 * optional `feedback` array joins the chronological feedback thread.
 */
export type MonthlyAppraisalReturnType = MonthlyAppraisalSelectType & {
  feedback?: ReadonlyArray<AppraisalFeedbackReturnType> | null;
};
/**
 * Teacher appraisal-list entry — student summary with an optional
 * `appraisalForMonth` summary used by the teacher appraisal list view.
 * When `month` is omitted from the service call, `appraisalForMonth` is
 * null on every entry (sparse UI distinguishes "no appraisal yet" from
 * "appraisal exists").
 */
export type MonthlyAppraisalStudentEntry = {
  id: string;
  name: string;
  studentAvatarUrl: string | null;
  parentId: string | null;
  parentName: string | null;
  parentAvatarUrl: string | null;
  status: string;
  hoursPerWeek: number;
  classesRemaining: number;
  classesTotal: number;
  appraisalForMonth: {
    id: string;
    month: Date;
    updatedAt: Date;
  } | null;
};
