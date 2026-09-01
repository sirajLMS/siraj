import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { EffectiveMeetingPothosObject } from "@/backend/graphql/pothos/meeting/effective-meeting.pothos";
import {
  CalculationStatusPothosEnum,
  ClassExecutionStatePothosObject,
  ClassOutcomePothosObject,
  ClassTypePothosObject,
  CurrencyCodePothosObject,
  RateSourcePothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import {
  SupportContactPothosObject,
  TeacherImportantNotePothosObject,
} from "@/backend/graphql/pothos/teachers/teacher-notes.pothos";
import type {
  ClassInstanceDetailReturnType,
  ClassInstancePerformanceReturnType,
  ClassInstanceStudentReturnType,
  ClassInstanceTeacherReturnType,
  ClassStatusEventReturnType,
  FutureClassReturnType,
  LeaveProcessResultReturnType,
  RescheduleClassInput,
  SupportRequestResultReturnType,
  TeacherFutureScheduleReturnType,
} from "@/backend/types";

// ─── Performance ─────────────────────────────────────────────────────────────

export const ClassInstancePerformanceRef =
  gqlSchemaBuilder.objectRef<ClassInstancePerformanceReturnType>("ClassInstancePerformance");

export const ClassInstancePerformancePothosObject = ClassInstancePerformanceRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    engagementScore: t.exposeInt("engagementScore", { nullable: true }),
    assessmentProgress: t.exposeInt("assessmentProgress", { nullable: true }),
    assessmentTotal: t.exposeInt("assessmentTotal", { nullable: true }),
    focusLevel: t.exposeString("focusLevel", { nullable: true }),
    sessionHealth: t.exposeString("sessionHealth", { nullable: true }),
    heatmapData: t.field({
      type: ["JSON"],
      nullable: true,
      resolve: p => p.heatmapData,
    }),
    latencyMs: t.exposeInt("latencyMs", { nullable: true }),
    authorizationLabel: t.exposeString("authorizationLabel", { nullable: true }),
    attendanceRate: t.exposeInt("attendanceRate", { nullable: true }),
    avgGrade: t.exposeString("avgGrade", { nullable: true }),
    lastClassDaysAgo: t.exposeInt("lastClassDaysAgo", { nullable: true }),
  }),
});

// ─── Student Info ─────────────────────────────────────────────────────────────

export const ClassInstanceStudentRef =
  gqlSchemaBuilder.objectRef<ClassInstanceStudentReturnType>("ClassInstanceStudentInfo");

export const ClassInstanceStudentPothosObject = ClassInstanceStudentRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    grade: t.exposeString("grade", { nullable: true }),
    level: t.exposeString("level", { nullable: true }),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
  }),
});

// ─── Teacher Info ─────────────────────────────────────────────────────────────

export const ClassInstanceTeacherRef =
  gqlSchemaBuilder.objectRef<ClassInstanceTeacherReturnType>("ClassInstanceTeacherInfo");

export const ClassInstanceTeacherPothosObject = ClassInstanceTeacherRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    title: t.exposeString("title", { nullable: true }),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
  }),
});

// ─── Class Instance Detail ────────────────────────────────────────────────────

export const ClassInstanceDetailRef = gqlSchemaBuilder.objectRef<ClassInstanceDetailReturnType>("ClassInstanceDetail");

export const ClassInstanceDetailPothosObject = ClassInstanceDetailRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    courseName: t.exposeString("courseName"),
    classType: t.expose("classType", { type: ClassTypePothosObject }),
    instanceId: t.exposeString("instanceId"),
    scheduledDate: t.exposeString("scheduledDate"),
    startTime: t.exposeString("startTime"),
    endTime: t.exposeString("endTime"),
    durationMinutes: t.exposeInt("durationMinutes"),
    status: t.expose("status", { type: ClassExecutionStatePothosObject }),
    remarks: t.exposeString("remarks", { nullable: true }),
    hasTimezoneMismatch: t.exposeBoolean("hasTimezoneMismatch"),
    studentTimezone: t.expose("studentTimezone", { type: "IanaTimezone", nullable: true }),
    teacherTimezone: t.expose("teacherTimezone", { type: "IanaTimezone", nullable: true }),
    meetingJoinUrl: t.exposeString("meetingJoinUrl", {
      nullable: true,
      deprecationReason: "Use effectiveMeeting.joinUrl",
    }),
    effectiveMeeting: t.expose("effectiveMeeting", {
      type: EffectiveMeetingPothosObject,
      nullable: true,
    }),
    recurringScheduleId: t.exposeString("recurringScheduleId", { nullable: true }),
    payrollCredited: t.exposeBoolean("payrollCredited"),
    isRescheduled: t.exposeBoolean("isRescheduled"),
    isFrozen: t.exposeBoolean("isFrozen"),
    executionState: t.expose("executionState", { type: ClassExecutionStatePothosObject }),
    outcome: t.expose("outcome", { type: ClassOutcomePothosObject }),
    // Rate snapshot (captured at booking time; admin can override per instance).
    rateAmount: t.exposeString("rateAmount", { nullable: true }),
    rateCurrency: t.expose("rateCurrency", { type: CurrencyCodePothosObject, nullable: true }),
    isRateOverridden: t.exposeBoolean("isRateOverridden"),
    rateSource: t.expose("rateSource", { type: RateSourcePothosEnum, nullable: true }),
    // Payroll calculation snapshot (written when a session reaches a terminal state).
    calculatedDuration: t.exposeInt("calculatedDuration", { nullable: true }),
    teacherPaidAmount: t.exposeString("teacherPaidAmount", { nullable: true }),
    teacherPaidCurrency: t.expose("teacherPaidCurrency", { type: CurrencyCodePothosObject, nullable: true }),
    calculationStatus: t.expose("calculationStatus", { type: CalculationStatusPothosEnum, nullable: true }),
    isPartialPercentage: t.exposeInt("isPartialPercentage", { nullable: true }),
    payrollNote: t.exposeString("payrollNote", { nullable: true }),
    payrollCalculatedAt: t.expose("payrollCalculatedAt", { type: "DateTime", nullable: true }),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    subjectId: t.exposeString("subjectId"),
    subjectName: t.exposeString("subjectName"),
    subjectAvatarUrl: t.exposeString("subjectAvatarUrl", { nullable: true }),
    student: t.expose("student", { type: ClassInstanceStudentPothosObject }),
    teacher: t.expose("teacher", { type: ClassInstanceTeacherPothosObject }),
    performance: t.expose("performance", {
      type: ClassInstancePerformancePothosObject,
      nullable: true,
    }),
  }),
});

// ─── Class Status Event ───────────────────────────────────────────────────────

export const ClassStatusEventRef = gqlSchemaBuilder.objectRef<ClassStatusEventReturnType>("ClassStatusEvent");

export const ClassStatusEventPothosObject = ClassStatusEventRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    eventType: t.exposeString("eventType"),
    description: t.exposeString("description", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});

// ─── Input: Reschedule Class ──────────────────────────────────────────────────

export const RescheduleClassInputPothosObject = gqlSchemaBuilder
  .inputRef<RescheduleClassInput>("RescheduleClassInput")
  .implement({
    fields: t => ({
      scheduledStartAt: t.string({ required: true, directives: { constraint: { maxLength: 50 } } }),
      scheduledEndAt: t.string({ required: true, directives: { constraint: { maxLength: 50 } } }),
      durationMinutes: t.int({ required: true, directives: { constraint: { min: 1, max: 1440 } } }),
    }),
  });

// ─── Support Request Result ───────────────────────────────────────────────────

export const SupportRequestResultRef =
  gqlSchemaBuilder.objectRef<SupportRequestResultReturnType>("SupportRequestResult");

export const SupportRequestResultPothosObject = SupportRequestResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    success: t.exposeBoolean("success"),
  }),
});

// ─── Future Class ────────────────────────────────────────────────────────────

export const FutureClassRef = gqlSchemaBuilder.objectRef<FutureClassReturnType>("FutureClass");

export const FutureClassPothosObject = FutureClassRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    courseName: t.exposeString("courseName"),
    scheduledDate: t.exposeString("scheduledDate"),
    startTime: t.exposeString("startTime"),
    endTime: t.exposeString("endTime"),
    durationMinutes: t.exposeInt("durationMinutes"),
    isRescheduled: t.exposeBoolean("isRescheduled"),
    leaveRequestDisabled: t.exposeBoolean("leaveRequestDisabled"),
    leaveRequestDisabledReason: t.exposeString("leaveRequestDisabledReason", { nullable: true }),
    studentCount: t.exposeInt("studentCount"),
    location: t.exposeString("location"),
    subjectId: t.exposeString("subjectId", { nullable: true }),
    subjectName: t.exposeString("subjectName", { nullable: true }),
    classType: t.expose("classType", { type: ClassTypePothosObject, nullable: true }),
    executionState: t.exposeString("executionState", { nullable: true }),
    outcome: t.exposeString("outcome", { nullable: true }),
    meetingJoinUrl: t.exposeString("meetingJoinUrl", {
      nullable: true,
      deprecationReason: "Use effectiveMeeting.joinUrl",
    }),
    effectiveMeeting: t.expose("effectiveMeeting", {
      type: EffectiveMeetingPothosObject,
      nullable: true,
    }),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
  }),
});

// ─── Teacher Future Schedule ─────────────────────────────────────────────────

export const TeacherFutureScheduleRef =
  gqlSchemaBuilder.objectRef<TeacherFutureScheduleReturnType>("TeacherFutureSchedule");

export const TeacherFutureSchedulePothosObject = TeacherFutureScheduleRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    leaveQuotaUsed: t.exposeInt("leaveQuotaUsed"),
    leaveQuotaTotal: t.exposeInt("leaveQuotaTotal"),
    totalClasses: t.exposeInt("totalClasses"),
    classes: t.field({
      type: [FutureClassPothosObject],
      resolve: parent => parent.classes,
    }),
    importantNotes: t.field({
      type: [TeacherImportantNotePothosObject],
      resolve: parent => parent.importantNotes,
    }),
    supportContact: t.field({
      type: SupportContactPothosObject,
      nullable: true,
      resolve: parent => parent.supportContact,
    }),
  }),
});

// ─── Delete Class Instance Result ────────────────────────────────────────────

export const DeleteClassInstanceResultRef = gqlSchemaBuilder.objectRef<{ success: boolean; warnings: string[] }>(
  "DeleteClassInstanceResult"
);

export const DeleteClassInstanceResultPothosObject = DeleteClassInstanceResultRef.implement({
  fields: t => ({
    success: t.exposeBoolean("success"),
    warnings: t.exposeStringList("warnings"),
  }),
});

// ─── Leave Process Result ───────────────────────────────────────────────────

export const LeaveProcessResultRef = gqlSchemaBuilder.objectRef<LeaveProcessResultReturnType>("LeaveProcessResult");

export const LeaveProcessResultPothosObject = LeaveProcessResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    completedInstanceId: t.exposeString("completedInstanceId"),
    rescheduledInstanceId: t.exposeString("rescheduledInstanceId"),
    completedInstance: t.expose("completedInstance", { type: ClassInstanceDetailPothosObject, nullable: true }),
    rescheduledInstance: t.expose("rescheduledInstance", {
      type: ClassInstanceDetailPothosObject,
      nullable: true,
    }),
  }),
});
