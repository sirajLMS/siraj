import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

// ─── Metrics ──────────────────────────────────────────────────────────────────

export type StudentHistoryMetricsDefinition = {
  totalClasses: number;
  attendanceRate: number;
  hoursStudied: number;
  performance: number;
};

const StudentHistoryMetricsRef = gqlSchemaBuilder.objectRef<StudentHistoryMetricsDefinition>("StudentHistoryMetrics");

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

export type StudentHistorySessionDefinition = {
  id: string;
  title: string;
  time: string;
  duration: number;
  status: string;
  instructor: string;
  timeSlot: string;
  room: string | null;
  notes: string;
  dayOfMonth: number;
};

const StudentHistorySessionRef = gqlSchemaBuilder.objectRef<StudentHistorySessionDefinition>("StudentHistorySession");

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

export type StudentClassHistoryDefinition = {
  id: string;
  studentName: string;
  metrics: StudentHistoryMetricsDefinition;
  sessions: StudentHistorySessionDefinition[];
};

const StudentClassHistoryRef = gqlSchemaBuilder.objectRef<StudentClassHistoryDefinition>("StudentClassHistory");

export const StudentClassHistoryPothosObject = StudentClassHistoryRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    studentName: t.exposeString("studentName"),
    metrics: t.expose("metrics", { type: StudentHistoryMetricsPothosObject }),
    sessions: t.expose("sessions", { type: [StudentHistorySessionPothosObject] }),
  }),
});

// ─── Session Detail ───────────────────────────────────────────────────────────

export type StudentSessionDetailDefinition = {
  id: string;
  durationMinutes: number;
  executionState: string;
  outcome: string | null;
  remarks: string | null;
  zoomMeetingUrl: string | null;
  teacherName: string;
  scheduledStartAt: Date | string;
  scheduledEndAt: Date | string;
};

const StudentSessionDetailRef = gqlSchemaBuilder.objectRef<StudentSessionDetailDefinition>("StudentSessionDetail");

export const StudentSessionDetailPothosObject = StudentSessionDetailRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    durationMinutes: t.exposeInt("durationMinutes"),
    executionState: t.exposeString("executionState"),
    outcome: t.exposeString("outcome", { nullable: true }),
    remarks: t.exposeString("remarks", { nullable: true }),
    zoomMeetingUrl: t.exposeString("zoomMeetingUrl", { nullable: true }),
    teacherName: t.exposeString("teacherName"),
    scheduledStartAt: t.expose("scheduledStartAt", { type: "DateTime", nullable: true }),
    scheduledEndAt: t.expose("scheduledEndAt", { type: "DateTime", nullable: true }),
  }),
});
