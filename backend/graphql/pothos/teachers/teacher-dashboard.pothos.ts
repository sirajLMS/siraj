import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  EffectiveMeetingPothosObject,
  resolveEffectiveMeetingForClassInstanceFromContext,
} from "@/backend/graphql/pothos/meeting/effective-meeting.pothos";
import {
  ClassExecutionStatePothosObject,
  ClassOutcomePothosObject,
  ClassTypePothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { PageInfoObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import type {
  ClassSessionMetrics,
  CreateManualClassEntryInput,
  LogSupportRequestInput,
  TeacherDashboardPaginatedResult,
  TeacherDashboardScheduleRow,
  TeacherHandbookUrl,
  TeacherProgressFeedItem,
} from "@/backend/types";

const TeacherProgressFeedEventKindRef = gqlSchemaBuilder.enumType("TeacherProgressFeedEventKind", {
  values: ["auto_missed", "marked_absent", "activated", "started", "completed", "leave", "other"] as const,
});

const TeacherDashboardScheduleRowRef =
  gqlSchemaBuilder.objectRef<TeacherDashboardScheduleRow>("TeacherDashboardScheduleRow");

export const TeacherDashboardScheduleRowPothosObject = TeacherDashboardScheduleRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    studentId: t.exposeString("studentId"),
    studentName: t.exposeString("studentName"),
    scheduledStartAt: t.expose("scheduledStartAt", { type: "DateTime" }),
    scheduledEndAt: t.expose("scheduledEndAt", { type: "DateTime" }),
    durationMinutes: t.exposeInt("durationMinutes"),
    executionState: t.expose("executionState", { type: ClassExecutionStatePothosObject }),
    outcome: t.expose("outcome", { type: ClassOutcomePothosObject, nullable: true }),
    isFrozen: t.exposeBoolean("isFrozen"),
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
    yourTimeFormatted: t.exposeString("yourTimeFormatted", { nullable: true }),
  }),
});

const TeacherProgressFeedItemRef = gqlSchemaBuilder.objectRef<TeacherProgressFeedItem>("TeacherProgressFeedItem");

export const TeacherProgressFeedItemPothosObject = TeacherProgressFeedItemRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    studentId: t.exposeString("studentId"),
    studentName: t.exposeString("studentName"),
    scheduledTimeFormatted: t.exposeString("scheduledTimeFormatted", { nullable: true }),
    durationMinutes: t.exposeInt("durationMinutes", { nullable: true }),
    eventKind: t.expose("eventKind", { type: TeacherProgressFeedEventKindRef }),
    occurredAt: t.expose("occurredAt", { type: "DateTime" }),
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

const TeacherDashboardRef = gqlSchemaBuilder.objectRef<TeacherDashboardPaginatedResult>("TeacherDashboard");

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

export const CreateManualClassEntryInputPothosObject = gqlSchemaBuilder
  .inputRef<CreateManualClassEntryInput>("CreateManualClassEntryInput")
  .implement({
    fields: t => ({
      studentId: t.id({ required: true }),
      teacherId: t.id({ required: true }),
      subjectId: t.id({ required: true }),
      scheduledStartAt: t.string({ required: true }),
      scheduledEndAt: t.string({ required: true }),
      durationMinutes: t.int({ required: true }),
      classType: t.field({ type: ClassTypePothosObject, required: false }),
    }),
  });

export const LogSupportRequestInputPothosObject = gqlSchemaBuilder
  .inputRef<LogSupportRequestInput>("LogSupportRequestInput")
  .implement({
    fields: t => ({
      reason: t.string({ required: true }),
    }),
  });

const TeacherHandbookUrlRef = gqlSchemaBuilder.objectRef<TeacherHandbookUrl>("TeacherHandbookUrl");

export const TeacherHandbookUrlPothosObject = TeacherHandbookUrlRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    url: t.exposeString("url"),
  }),
});
