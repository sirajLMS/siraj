import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type {
  AppraisalFeedbackInput,
  AppraisalFeedbackReturnType,
  MonthlyAppraisalReturnType,
  MonthlyAppraisalStudentEntry,
  MonthlyAppraisalSubmitInput,
} from "@/backend/types";

// ---------------------------------------------------------------------------
// Object types — single canonical type per entity, every type includes `id`
// (Apollo cache normalization). Nullable rubric fields stay nullable so the
// UI can render sparse reports (R1.3).
// ---------------------------------------------------------------------------

export const MonthlyAppraisalFeedbackRef =
  gqlSchemaBuilder.objectRef<AppraisalFeedbackReturnType>("MonthlyAppraisalFeedback");

export const MonthlyAppraisalFeedbackPothosObject = MonthlyAppraisalFeedbackRef.implement({
  description: "A parent/student feedback entry appended to a monthly appraisal.",
  fields: t => ({
    id: t.exposeString("id"),
    appraisalId: t.exposeString("appraisalId"),
    authorUserId: t.exposeString("authorUserId"),
    authorName: t.exposeString("authorName", { nullable: true }),
    body: t.exposeString("body"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});

export const MonthlyAppraisalRef = gqlSchemaBuilder.objectRef<MonthlyAppraisalReturnType>("MonthlyAppraisal");

export const MonthlyAppraisalPothosObject = MonthlyAppraisalRef.implement({
  description: "A teacher's monthly appraisal of a student — sparse rubric (1..5 grades, nullable) + feedback thread.",
  fields: t => ({
    id: t.exposeString("id"),
    studentId: t.exposeString("studentId"),
    teacherId: t.exposeString("teacherId"),
    month: t.expose("month", { type: "DateTime" }),
    behaviorGrade: t.exposeInt("behaviorGrade", { nullable: true }),
    behaviorComment: t.exposeString("behaviorComment", { nullable: true }),
    attendanceGrade: t.exposeInt("attendanceGrade", { nullable: true }),
    attendanceComment: t.exposeString("attendanceComment", { nullable: true }),
    punctualityGrade: t.exposeInt("punctualityGrade", { nullable: true }),
    punctualityComment: t.exposeString("punctualityComment", { nullable: true }),
    overallGrade: t.exposeInt("overallGrade", { nullable: true }),
    overallComment: t.exposeString("overallComment", { nullable: true }),
    learningTargets: t.exposeString("learningTargets"),
    feedback: t.expose("feedback", { type: [MonthlyAppraisalFeedbackPothosObject], nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

export const MonthlyAppraisalForMonthRef =
  gqlSchemaBuilder.objectRef<NonNullable<MonthlyAppraisalStudentEntry["appraisalForMonth"]>>(
    "MonthlyAppraisalForMonth"
  );

export const MonthlyAppraisalForMonthPothosObject = MonthlyAppraisalForMonthRef.implement({
  description: "Summary of an existing appraisal for a specific month (teacher appraisal list view).",
  fields: t => ({
    id: t.exposeString("id"),
    month: t.expose("month", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

export const MonthlyAppraisalStudentEntryRef =
  gqlSchemaBuilder.objectRef<MonthlyAppraisalStudentEntry>("MonthlyAppraisalStudentEntry");

export const MonthlyAppraisalStudentEntryPothosObject = MonthlyAppraisalStudentEntryRef.implement({
  description: "A student summary row for the teacher appraisal list, with an optional appraisal-for-month summary.",
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    studentAvatarUrl: t.exposeString("studentAvatarUrl", { nullable: true }),
    parentId: t.exposeString("parentId", { nullable: true }),
    parentName: t.exposeString("parentName", { nullable: true }),
    parentAvatarUrl: t.exposeString("parentAvatarUrl", { nullable: true }),
    status: t.exposeString("status"),
    hoursPerWeek: t.exposeInt("hoursPerWeek"),
    classesRemaining: t.exposeInt("classesRemaining"),
    classesTotal: t.exposeInt("classesTotal"),
    appraisalForMonth: t.expose("appraisalForMonth", {
      type: MonthlyAppraisalForMonthPothosObject,
      nullable: true,
    }),
  }),
});

// ---------------------------------------------------------------------------
// Input types — `teacherId` is NEVER in the submit input (resolved from auth
// context in the service layer per BOLA defense).
// ---------------------------------------------------------------------------

export const SubmitMonthlyAppraisalInputPothosObject = gqlSchemaBuilder
  .inputRef<Omit<MonthlyAppraisalSubmitInput, "teacherId">>("SubmitMonthlyAppraisalInput")
  .implement({
    description:
      "Input for a teacher submitting/updating a monthly appraisal. `teacherId` is resolved from auth context.",
    fields: t => ({
      studentId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      month: t.field({ type: "DateTime", required: true }),
      behaviorGrade: t.int({ required: false, directives: { constraint: { min: 1, max: 5 } } }),
      behaviorComment: t.string({ required: false, directives: { constraint: { maxLength: 2000 } } }),
      attendanceGrade: t.int({ required: false, directives: { constraint: { min: 1, max: 5 } } }),
      attendanceComment: t.string({ required: false, directives: { constraint: { maxLength: 2000 } } }),
      punctualityGrade: t.int({ required: false, directives: { constraint: { min: 1, max: 5 } } }),
      punctualityComment: t.string({ required: false, directives: { constraint: { maxLength: 2000 } } }),
      overallGrade: t.int({ required: false, directives: { constraint: { min: 1, max: 5 } } }),
      overallComment: t.string({ required: false, directives: { constraint: { maxLength: 2000 } } }),
      learningTargets: t.string({ required: true, directives: { constraint: { maxLength: 5000 } } }),
    }),
  });

export const AddAppraisalFeedbackInputPothosObject = gqlSchemaBuilder
  .inputRef<Omit<AppraisalFeedbackInput, "authorUserId">>("AddAppraisalFeedbackInput")
  .implement({
    description: "Input for a parent/student appending feedback to a published monthly appraisal.",
    fields: t => ({
      appraisalId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      body: t.string({ required: true, directives: { constraint: { maxLength: 5000 } } }),
    }),
  });

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
