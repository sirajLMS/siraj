import type { ClassSessionMetrics, PageInfo } from "@/backend/types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { PageInfoObject } from "../pothos/pagination.objects";

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

const TeacherDashboardMetricsRef = gqlSchemaBuilder.objectRef<ClassSessionMetrics>("TeacherDashboardMetrics");

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

export type TeacherDashboardDefinition = {
  id: string;
  metrics: ClassSessionMetrics;
  scheduleRows: TeacherDashboardScheduleRowDefinition[];
  progressFeed: TeacherProgressFeedItemDefinition[];
  totalCount: number;
  pageInfo: PageInfo | null;
};

const TeacherDashboardRef = gqlSchemaBuilder.objectRef<TeacherDashboardDefinition>("TeacherDashboard");

export const TeacherDashboardPothosObject = TeacherDashboardRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    metrics: t.expose("metrics", { type: TeacherDashboardMetricsPothosObject }),
    scheduleRows: t.expose("scheduleRows", { type: [TeacherDashboardScheduleRowPothosObject] }),
    progressFeed: t.expose("progressFeed", { type: [TeacherProgressFeedItemPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

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
