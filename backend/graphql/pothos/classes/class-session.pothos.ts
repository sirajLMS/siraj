import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  EffectiveMeetingPothosObject,
  resolveEffectiveMeetingForClassInstanceFromContext,
} from "@/backend/graphql/pothos/meeting/effective-meeting.pothos";
import {
  ClassExecutionStatePothosObject,
  ClassOutcomePothosObject,
  ClassTypePothosObject,
  IanaTimezonePothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import {
  SupportContactPothosObject,
  TeacherImportantNotePothosObject,
} from "@/backend/graphql/pothos/teachers/teacher-notes.pothos";
import { ClassSessionService } from "@/backend/services/session/class-session.service";
import type {
  ClassInstanceDetailReturnType,
  ClassInstancePerformanceReturnType,
  ClassInstanceStudentReturnType,
  ClassInstanceTeacherReturnType,
  ClassStatusEventReturnType,
  FutureClassReturnType,
  LeaveProcessResultReturnType,
  RescheduleClassInputType,
  SupportRequestResultReturnType,
  TeacherFutureScheduleReturnType,
} from "@/backend/types";

// ─── Performance ─────────────────────────────────────────────────────────────

const ClassInstancePerformanceRef =
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

const ClassInstanceStudentRef = gqlSchemaBuilder.objectRef<ClassInstanceStudentReturnType>("ClassInstanceStudentInfo");

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

const ClassInstanceTeacherRef = gqlSchemaBuilder.objectRef<ClassInstanceTeacherReturnType>("ClassInstanceTeacherInfo");

export const ClassInstanceTeacherPothosObject = ClassInstanceTeacherRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    title: t.exposeString("title", { nullable: true }),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
  }),
});

// ─── Class Instance Detail ────────────────────────────────────────────────────

const ClassInstanceDetailRef = gqlSchemaBuilder.objectRef<ClassInstanceDetailReturnType>("ClassInstanceDetail");

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
    studentTimezone: t.expose("studentTimezone", { type: IanaTimezonePothosObject, nullable: true }),
    teacherTimezone: t.expose("teacherTimezone", { type: IanaTimezonePothosObject, nullable: true }),
    meetingJoinUrl: t.string({
      nullable: true,
      deprecationReason: "Use effectiveMeeting.joinUrl",
      resolve: async (parent, _args, ctx) => {
        const meeting = await resolveEffectiveMeetingForClassInstanceFromContext(parent.id, ctx);
        return meeting.joinUrl;
      },
    }),
    effectiveMeeting: t.field({
      type: EffectiveMeetingPothosObject,
      resolve: (parent, _args, ctx) => resolveEffectiveMeetingForClassInstanceFromContext(parent.id, ctx),
    }),
    recurringScheduleId: t.exposeString("recurringScheduleId", { nullable: true }),
    payrollCredited: t.exposeBoolean("payrollCredited"),
    isRescheduled: t.exposeBoolean("isRescheduled"),
    isFrozen: t.exposeBoolean("isFrozen"),
    executionState: t.expose("executionState", { type: ClassExecutionStatePothosObject }),
    outcome: t.expose("outcome", { type: ClassOutcomePothosObject }),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    subjectId: t.exposeString("subjectId"),
    subjectName: t.exposeString("subjectName"),
    student: t.expose("student", { type: ClassInstanceStudentPothosObject }),
    teacher: t.expose("teacher", { type: ClassInstanceTeacherPothosObject }),
    performance: t.expose("performance", {
      type: ClassInstancePerformancePothosObject,
      nullable: true,
    }),
  }),
});

// ─── Class Status Event ───────────────────────────────────────────────────────

const ClassStatusEventRef = gqlSchemaBuilder.objectRef<ClassStatusEventReturnType>("ClassStatusEvent");

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
  .inputRef<RescheduleClassInputType>("RescheduleClassInput")
  .implement({
    fields: t => ({
      scheduledStartAt: t.string({ required: true }),
      scheduledEndAt: t.string({ required: true }),
      durationMinutes: t.int({ required: true }),
    }),
  });

// ─── Support Request Result ───────────────────────────────────────────────────

const SupportRequestResultRef = gqlSchemaBuilder.objectRef<SupportRequestResultReturnType>("SupportRequestResult");

export const SupportRequestResultPothosObject = SupportRequestResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    success: t.exposeBoolean("success"),
  }),
});

// ─── Future Class ────────────────────────────────────────────────────────────

const FutureClassRef = gqlSchemaBuilder.objectRef<FutureClassReturnType>("FutureClass");

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
    meetingJoinUrl: t.string({
      nullable: true,
      deprecationReason: "Use effectiveMeeting.joinUrl",
      resolve: async (parent, _args, ctx) => {
        const meeting = await resolveEffectiveMeetingForClassInstanceFromContext(parent.id, ctx);
        return meeting.joinUrl;
      },
    }),
    effectiveMeeting: t.field({
      type: EffectiveMeetingPothosObject,
      resolve: (parent, _args, ctx) => resolveEffectiveMeetingForClassInstanceFromContext(parent.id, ctx),
    }),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
  }),
});

// ─── Teacher Future Schedule ─────────────────────────────────────────────────

const TeacherFutureScheduleRef = gqlSchemaBuilder.objectRef<TeacherFutureScheduleReturnType>("TeacherFutureSchedule");

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

// ─── Leave Process Result ───────────────────────────────────────────────────

const LeaveProcessResultRef = gqlSchemaBuilder.objectRef<LeaveProcessResultReturnType>("LeaveProcessResult");

export const LeaveProcessResultPothosObject = LeaveProcessResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    completedInstanceId: t.exposeString("completedInstanceId"),
    rescheduledInstanceId: t.exposeString("rescheduledInstanceId"),
    completedInstance: t.field({
      type: ClassInstanceDetailPothosObject,
      resolve: async (parent, _args, ctx) => {
        if (!ctx.user) {
          const tErrors = ctx.t().errorsTranslations;
          throw new Error(tErrors.unauthorized);
        }
        const tErrors = ctx.t().errorsTranslations;
        const tSession = ctx.t().sessionTranslations;
        return ClassSessionService.getClassInstanceDetail(ctx.user.id, parent.completedInstanceId, tSession, tErrors);
      },
    }),
    rescheduledInstance: t.field({
      type: ClassInstanceDetailPothosObject,
      resolve: async (parent, _args, ctx) => {
        if (!ctx.user) {
          const tErrors = ctx.t().errorsTranslations;
          throw new Error(tErrors.unauthorized);
        }
        const tErrors = ctx.t().errorsTranslations;
        const tSession = ctx.t().sessionTranslations;
        return ClassSessionService.getClassInstanceDetail(ctx.user.id, parent.rescheduledInstanceId, tSession, tErrors);
      },
    }),
  }),
});
