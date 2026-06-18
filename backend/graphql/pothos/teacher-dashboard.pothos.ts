import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

// ─── Schedule Row ─────────────────────────────────────────────────────────────

export type TeacherDashboardScheduleRowDefinition = {
  id: string;
  studentId: string;
  studentName: string;
  scheduledStartAt: Date | string;
  durationMinutes: number;
  executionState: string;
  outcome: string | null;
  zoomMeetingUrl: string | null;
  yourTimeFormatted: string | null;
};

const TeacherDashboardScheduleRowRef =
  gqlSchemaBuilder.objectRef<TeacherDashboardScheduleRowDefinition>("TeacherDashboardScheduleRow");

export const TeacherDashboardScheduleRowPothosObject = TeacherDashboardScheduleRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    studentId: t.exposeString("studentId"),
    studentName: t.exposeString("studentName"),
    scheduledStartAt: t.expose("scheduledStartAt", { type: "DateTime" }),
    durationMinutes: t.exposeInt("durationMinutes"),
    executionState: t.exposeString("executionState"),
    outcome: t.exposeString("outcome", { nullable: true }),
    zoomMeetingUrl: t.exposeString("zoomMeetingUrl", { nullable: true }),
    yourTimeFormatted: t.exposeString("yourTimeFormatted", { nullable: true }),
  }),
});

// ─── Progress Feed Item ───────────────────────────────────────────────────────

export type TeacherProgressFeedItemDefinition = {
  id: string;
  title: string;
  type: string;
};

const TeacherProgressFeedItemRef =
  gqlSchemaBuilder.objectRef<TeacherProgressFeedItemDefinition>("TeacherProgressFeedItem");

export const TeacherProgressFeedItemPothosObject = TeacherProgressFeedItemRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    title: t.exposeString("title"),
    type: t.exposeString("type"),
  }),
});

// ─── Metrics ──────────────────────────────────────────────────────────────────

export type TeacherDashboardMetricsDefinition = {
  total: number;
  regular: number;
  trial: number;
  advance: number;
  rescheduled: number;
  suspended: number;
  taken: number;
  pending: number;
  activated: number;
  running: number;
  absent: number;
  leave: number;
};

const TeacherDashboardMetricsRef =
  gqlSchemaBuilder.objectRef<TeacherDashboardMetricsDefinition>("TeacherDashboardMetrics");

export const TeacherDashboardMetricsPothosObject = TeacherDashboardMetricsRef.implement({
  fields: t => ({
    total: t.exposeInt("total"),
    regular: t.exposeInt("regular"),
    trial: t.exposeInt("trial"),
    advance: t.exposeInt("advance"),
    rescheduled: t.exposeInt("rescheduled"),
    suspended: t.exposeInt("suspended"),
    taken: t.exposeInt("taken"),
    pending: t.exposeInt("pending"),
    activated: t.exposeInt("activated"),
    running: t.exposeInt("running"),
    absent: t.exposeInt("absent"),
    leave: t.exposeInt("leave"),
  }),
});

// ─── Dashboard ────────────────────────────────────────────────────────────────

export type TeacherDashboardDefinition = {
  id: string;
  metrics: TeacherDashboardMetricsDefinition;
  scheduleRows: TeacherDashboardScheduleRowDefinition[];
  progressFeed: TeacherProgressFeedItemDefinition[];
};

const TeacherDashboardRef = gqlSchemaBuilder.objectRef<TeacherDashboardDefinition>("TeacherDashboard");

export const TeacherDashboardPothosObject = TeacherDashboardRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    metrics: t.expose("metrics", { type: TeacherDashboardMetricsPothosObject }),
    scheduleRows: t.expose("scheduleRows", { type: [TeacherDashboardScheduleRowPothosObject] }),
    progressFeed: t.expose("progressFeed", { type: [TeacherProgressFeedItemPothosObject] }),
  }),
});

// ─── Input: Create Manual Class Entry ────────────────────────────────────────

export type CreateManualClassEntryInputDefinition = {
  studentId: string;
  teacherId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  durationMinutes: number;
  classType?: string | null;
};

export const CreateManualClassEntryInputPothosObject = gqlSchemaBuilder
  .inputRef<CreateManualClassEntryInputDefinition>("CreateManualClassEntryInput")
  .implement({
    fields: t => ({
      studentId: t.id({ required: true }),
      teacherId: t.id({ required: true }),
      scheduledStartAt: t.string({ required: true }),
      scheduledEndAt: t.string({ required: true }),
      durationMinutes: t.int({ required: true }),
      classType: t.string({ required: false }),
    }),
  });

// ─── Input: Log Support Request ───────────────────────────────────────────────

export type LogSupportRequestInputDefinition = {
  reason: string;
};

export const LogSupportRequestInputPothosObject = gqlSchemaBuilder
  .inputRef<LogSupportRequestInputDefinition>("LogSupportRequestInput")
  .implement({
    fields: t => ({
      reason: t.string({ required: true }),
    }),
  });

// ─── Teacher Handbook URL ─────────────────────────────────────────────────────

export type TeacherHandbookUrlDefinition = {
  id: string;
  url: string;
};

const TeacherHandbookUrlRef = gqlSchemaBuilder.objectRef<TeacherHandbookUrlDefinition>("TeacherHandbookUrl");

export const TeacherHandbookUrlPothosObject = TeacherHandbookUrlRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    url: t.exposeString("url"),
  }),
});
