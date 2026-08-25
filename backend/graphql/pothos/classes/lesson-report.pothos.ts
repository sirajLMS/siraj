import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AttendanceEvaluationPothosEnum,
  LessonReportStatusPothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import type {
  LessonReportReturnType,
  LessonReportSubmitInput as LessonReportSubmitInputType,
  LessonReviewInput as LessonReviewInputType,
  PendingLessonReportsPayload,
  PendingReviewCountReturnType,
} from "@/backend/types";

export const LessonReportRef = gqlSchemaBuilder.objectRef<LessonReportReturnType>("LessonReport");

export const LessonReportPothosObject = LessonReportRef.implement({
  description: "A teacher-submitted lesson report for a completed class instance, with review workflow",
  fields: t => ({
    id: t.exposeString("id"),
    classInstanceId: t.exposeString("classInstanceId"),
    studentId: t.exposeString("studentId"),
    teacherId: t.exposeString("teacherId"),
    teacherName: t.exposeString("teacherName", { nullable: true }),
    studentName: t.exposeString("studentName", { nullable: true }),
    subjectName: t.exposeString("subjectName", { nullable: true }),
    classAvatarUrl: t.exposeString("classAvatarUrl", { nullable: true }),
    teacherAvatarUrl: t.exposeString("teacherAvatarUrl", { nullable: true }),
    studentAvatarUrl: t.exposeString("studentAvatarUrl", { nullable: true }),
    teacherUserId: t.exposeString("teacherUserId", { nullable: true }),
    studentUserId: t.exposeString("studentUserId", { nullable: true }),
    lessonDate: t.expose("lessonDate", { type: "DateTime" }),
    durationMinutes: t.exposeInt("durationMinutes"),
    attendanceEvaluation: t.expose("attendanceEvaluation", { type: AttendanceEvaluationPothosEnum }),
    teacherNotes: t.exposeString("teacherNotes", { nullable: true }),
    studentNotes: t.exposeString("studentNotes", { nullable: true }),
    completionPercentage: t.exposeInt("completionPercentage"),
    status: t.expose("status", { type: LessonReportStatusPothosEnum }),
    submittedByUserId: t.exposeString("submittedByUserId"),
    submittedAt: t.expose("submittedAt", { type: "DateTime" }),
    reviewedByUserId: t.exposeString("reviewedByUserId", { nullable: true }),
    reviewedAt: t.expose("reviewedAt", { type: "DateTime", nullable: true }),
    rejectionReason: t.exposeString("rejectionReason", { nullable: true }),
    idempotencyKey: t.exposeString("idempotencyKey"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

export const LessonReportSubmitInput = gqlSchemaBuilder
  .inputRef<LessonReportSubmitInputType>("LessonReportSubmitInput")
  .implement({
    description: "Input for submitting a lesson report for a completed class instance",
    fields: t => ({
      classInstanceId: t.id({ required: true }),
      attendanceEvaluation: t.field({ type: AttendanceEvaluationPothosEnum, required: true }),
      durationMinutes: t.int({ required: true, directives: { constraint: { min: 1, max: 1440 } } }),
      teacherNotes: t.string({ required: false, directives: { constraint: { maxLength: 5000 } } }),
      completionPercentage: t.int({ required: true, directives: { constraint: { min: 0, max: 100 } } }),
    }),
  });

export const LessonReviewInput = gqlSchemaBuilder.inputRef<LessonReviewInputType>("LessonReviewInput").implement({
  description: "Input for reviewing (approving/rejecting) a lesson report",
  fields: t => ({
    reportId: t.id({ required: true }),
    rejectionReason: t.string({ required: false, directives: { constraint: { maxLength: 2000 } } }),
  }),
});

export const PendingReviewCountRef = gqlSchemaBuilder.objectRef<PendingReviewCountReturnType>("PendingReviewCount");

export const PendingReviewCountPothosObject = PendingReviewCountRef.implement({
  description: "Count of pending lesson reports awaiting review",
  fields: t => ({
    pendingCount: t.exposeInt("pendingCount"),
  }),
});

// ─── PendingLessonReportsPayload (paginated list wrapper) ─────────────────────

export const PendingLessonReportsPayloadRef =
  gqlSchemaBuilder.objectRef<PendingLessonReportsPayload>("PendingLessonReportsPayload");

export const PendingLessonReportsPayloadPothosObject = PendingLessonReportsPayloadRef.implement({
  description: "Paginated pending lesson reports awaiting review, with total count",
  fields: t => ({
    rows: t.expose("rows", { type: [LessonReportPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
  }),
});
