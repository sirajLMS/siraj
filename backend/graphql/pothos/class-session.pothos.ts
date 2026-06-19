import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { resolveDetail } from "../utils/class-session.utils";

// ─── Performance ─────────────────────────────────────────────────────────────

export type ClassInstancePerformanceDefinition = {
  engagementScore: number | null;
  assessmentProgress: number | null;
  assessmentTotal: number | null;
  focusLevel: string | null;
  sessionHealth: string | null;
  heatmapData: number[] | null;
  latencyMs: number | null;
  attendanceRate: number | null;
  avgGrade: string | null;
  lastClassDaysAgo: number | null;
};

const ClassInstancePerformanceRef =
  gqlSchemaBuilder.objectRef<ClassInstancePerformanceDefinition>("ClassInstancePerformance");

export const ClassInstancePerformancePothosObject = ClassInstancePerformanceRef.implement({
  fields: t => ({
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
    attendanceRate: t.exposeInt("attendanceRate", { nullable: true }),
    avgGrade: t.exposeString("avgGrade", { nullable: true }),
    lastClassDaysAgo: t.exposeInt("lastClassDaysAgo", { nullable: true }),
  }),
});

// ─── Student Info ─────────────────────────────────────────────────────────────

export type ClassInstanceStudentDefinition = {
  id: string;
  name: string;
  grade: string | null;
  level: string | null;
  avatarUrl: string | null;
};

const ClassInstanceStudentRef = gqlSchemaBuilder.objectRef<ClassInstanceStudentDefinition>("ClassInstanceStudentInfo");

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

export type ClassInstanceTeacherDefinition = {
  id: string;
  name: string;
  title: string | null;
  avatarUrl: string | null;
};

const ClassInstanceTeacherRef = gqlSchemaBuilder.objectRef<ClassInstanceTeacherDefinition>("ClassInstanceTeacherInfo");

export const ClassInstanceTeacherPothosObject = ClassInstanceTeacherRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    title: t.exposeString("title", { nullable: true }),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
  }),
});

// ─── Class Instance Detail ────────────────────────────────────────────────────

export type ClassInstanceDetailDefinition = {
  id: string;
  courseName: string;
  instanceId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: string;
  remarks: string | null;
  hasTimezoneMismatch: boolean;
  studentTimezone: string | null;
  zoomMeetingUrl: string | null;
  payrollCredited: boolean;
  isRescheduled: boolean;
  executionState: string;
  outcome: string;
  student: ClassInstanceStudentDefinition;
  teacher: ClassInstanceTeacherDefinition;
  performance: ClassInstancePerformanceDefinition | null;
};

const ClassInstanceDetailRef = gqlSchemaBuilder.objectRef<ClassInstanceDetailDefinition>("ClassInstanceDetail");

export const ClassInstanceDetailPothosObject = ClassInstanceDetailRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    courseName: t.exposeString("courseName"),
    instanceId: t.exposeString("instanceId"),
    scheduledDate: t.exposeString("scheduledDate"),
    startTime: t.exposeString("startTime"),
    endTime: t.exposeString("endTime"),
    durationMinutes: t.exposeInt("durationMinutes"),
    status: t.exposeString("status"),
    remarks: t.exposeString("remarks", { nullable: true }),
    hasTimezoneMismatch: t.exposeBoolean("hasTimezoneMismatch"),
    studentTimezone: t.exposeString("studentTimezone", { nullable: true }),
    zoomMeetingUrl: t.exposeString("zoomMeetingUrl", { nullable: true }),
    payrollCredited: t.exposeBoolean("payrollCredited"),
    isRescheduled: t.exposeBoolean("isRescheduled"),
    executionState: t.exposeString("executionState"),
    outcome: t.exposeString("outcome"),
    student: t.expose("student", { type: ClassInstanceStudentPothosObject }),
    teacher: t.expose("teacher", { type: ClassInstanceTeacherPothosObject }),
    performance: t.expose("performance", {
      type: ClassInstancePerformancePothosObject,
      nullable: true,
    }),
  }),
});

// ─── Class Status Event ───────────────────────────────────────────────────────

export type ClassStatusEventDefinition = {
  id: string;
  eventType: string;
  description: string | null;
  createdAt: Date | string;
};

const ClassStatusEventRef = gqlSchemaBuilder.objectRef<ClassStatusEventDefinition>("ClassStatusEvent");

export const ClassStatusEventPothosObject = ClassStatusEventRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    eventType: t.exposeString("eventType"),
    description: t.exposeString("description", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});

// ─── Input: Reschedule Class ──────────────────────────────────────────────────

export type RescheduleClassInputDefinition = {
  scheduledStartAt: string;
  scheduledEndAt: string;
  durationMinutes: number;
};

export const RescheduleClassInputPothosObject = gqlSchemaBuilder
  .inputRef<RescheduleClassInputDefinition>("RescheduleClassInput")
  .implement({
    fields: t => ({
      scheduledStartAt: t.string({ required: true }),
      scheduledEndAt: t.string({ required: true }),
      durationMinutes: t.int({ required: true }),
    }),
  });

// ─── Support Request Result ───────────────────────────────────────────────────

export type SupportRequestResultDefinition = {
  id: string;
  success: boolean;
};

const SupportRequestResultRef = gqlSchemaBuilder.objectRef<SupportRequestResultDefinition>("SupportRequestResult");

export const SupportRequestResultPothosObject = SupportRequestResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    success: t.exposeBoolean("success"),
  }),
});

// ─── Future Class ────────────────────────────────────────────────────────────

export type FutureClassDefinition = {
  id: string;
  courseName: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isRescheduled: boolean;
  leaveRequestDisabled: boolean;
  leaveRequestDisabledReason: string | null;
  studentCount: number;
  location: string;
};

const FutureClassRef = gqlSchemaBuilder.objectRef<FutureClassDefinition>("FutureClass");

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
  }),
});

// ─── Teacher Future Schedule ─────────────────────────────────────────────────

export type TeacherFutureScheduleDefinition = {
  id: string;
  leaveQuotaUsed: number;
  leaveQuotaTotal: number;
  totalClasses: number;
  classes: FutureClassDefinition[];
};

const TeacherFutureScheduleRef =
  gqlSchemaBuilder.objectRef<TeacherFutureScheduleDefinition>("TeacherFutureSchedule");

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
  }),
});

// ─── Leave Process Result ───────────────────────────────────────────────────

export type LeaveProcessResultDefinition = {
  id: string;
  completedInstanceId: string;
  rescheduledInstanceId: string;
};

const LeaveProcessResultRef = gqlSchemaBuilder.objectRef<LeaveProcessResultDefinition>("LeaveProcessResult");

export const LeaveProcessResultPothosObject = LeaveProcessResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    completedInstanceId: t.exposeString("completedInstanceId"),
    rescheduledInstanceId: t.exposeString("rescheduledInstanceId"),
    completedInstance: t.field({
      type: ClassInstanceDetailPothosObject,
      resolve: (parent, _args, ctx) => resolveDetail(parent.completedInstanceId, ctx.locale),
    }),
    rescheduledInstance: t.field({
      type: ClassInstanceDetailPothosObject,
      resolve: (parent, _args, ctx) => resolveDetail(parent.rescheduledInstanceId, ctx.locale),
    }),
  }),
});
