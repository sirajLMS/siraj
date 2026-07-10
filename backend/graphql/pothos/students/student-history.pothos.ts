import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type {
  StudentClassHistory,
  StudentHistoryMetricsType,
  StudentHistorySession,
  StudentSessionDetail,
} from "@/backend/types";

// ─── Metrics ──────────────────────────────────────────────────────────────────

const StudentHistoryMetricsRef = gqlSchemaBuilder.objectRef<StudentHistoryMetricsType>("StudentHistoryMetrics");

export const StudentHistoryMetricsPothosObject = StudentHistoryMetricsRef.implement({
  fields: t => ({
    totalClasses: t.exposeInt("totalClasses"),
    attendanceRate: t.exposeInt("attendanceRate"),
    hoursStudied: t.field({
      type: "Float",
      resolve: m => m.hoursStudied,
    }),
    performance: t.exposeInt("performance"),
  }),
});

// ─── Session ──────────────────────────────────────────────────────────────────

const StudentHistorySessionRef = gqlSchemaBuilder.objectRef<StudentHistorySession>("StudentHistorySession");

export const StudentHistorySessionPothosObject = StudentHistorySessionRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    title: t.exposeString("title"),
    time: t.exposeString("time"),
    duration: t.exposeInt("duration"),
    status: t.exposeString("status"),
    instructor: t.exposeString("instructor"),
    timeSlot: t.exposeString("timeSlot"),
    room: t.exposeString("room", { nullable: true }),
    notes: t.exposeString("notes"),
    dayOfMonth: t.exposeInt("dayOfMonth"),
  }),
});

// ─── Class History ────────────────────────────────────────────────────────────

const StudentClassHistoryRef = gqlSchemaBuilder.objectRef<StudentClassHistory>("StudentClassHistory");

export const StudentClassHistoryPothosObject = StudentClassHistoryRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    studentName: t.exposeString("studentName"),
    metrics: t.expose("metrics", { type: StudentHistoryMetricsPothosObject }),
    sessions: t.expose("sessions", { type: [StudentHistorySessionPothosObject] }),
  }),
});

// ─── Session Detail ───────────────────────────────────────────────────────────

const StudentSessionDetailRef = gqlSchemaBuilder.objectRef<StudentSessionDetail>("StudentSessionDetail");

export const StudentSessionDetailPothosObject = StudentSessionDetailRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    durationMinutes: t.exposeInt("durationMinutes"),
    executionState: t.exposeString("executionState"),
    outcome: t.exposeString("outcome", { nullable: true }),
    remarks: t.exposeString("remarks", { nullable: true }),
    meetingJoinUrl: t.exposeString("meetingJoinUrl", { nullable: true }),
    teacherName: t.exposeString("teacherName"),
    scheduledStartAt: t.expose("scheduledStartAt", { type: "DateTime", nullable: true }),
    scheduledEndAt: t.expose("scheduledEndAt", { type: "DateTime", nullable: true }),
  }),
});
