import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { classExecutionFields } from "@/backend/graphql/pothos/scheduling/__shared__/classExecutionFields";
import { classSessionMetricsFields } from "@/backend/graphql/pothos/scheduling/__shared__/classSessionMetricsFields";
import {
  ClassExecutionStatePothosObject,
  IanaTimezonePothosObject,
  LeaveRequestStatusPothosObject,
  RescheduleDateLabelPothosObject,
  StudentStatusPothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { PageInfoObject, PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { ScheduleQueryService } from "@/backend/services";
import type {
  AdminDashboardScheduleReturnType,
  ClassSessionMetrics,
  DailyScheduleListReturnType,
  DailyScheduleListUserItem,
  RescheduleTrackingInput,
  RescheduleTrackingMetrics,
  RescheduleTrackingPaginatedResult,
  RescheduleTrackingRow,
  StatusTrackingScheduleRow,
} from "@/backend/types";
import type { AdminDashboardScheduleInput } from "@/backend/types/scheduling/schedule.types";

const DailyScheduleMetricsObjectRef = gqlSchemaBuilder.objectRef<ClassSessionMetrics>("DailyScheduleMetrics");

export const DailyScheduleMetricsPothosObject = DailyScheduleMetricsObjectRef.implement({
  fields: t => ({
    ...classSessionMetricsFields(t, { idNullable: true }),
    total: t.exposeInt("total"),
    regular: t.exposeInt("regular"),
    trial: t.exposeInt("trial"),
    advance: t.exposeInt("advance"),
    suspended: t.exposeInt("suspended"),
    taken: t.exposeInt("taken"),
    activated: t.exposeInt("activated"),
    running: t.exposeInt("running"),
    absent: t.exposeInt("absent"),
  }),
});

const DailyScheduleListUserItemRef = gqlSchemaBuilder.objectRef<DailyScheduleListUserItem>("DailyScheduleListUserItem");
const DailyScheduleListUserItemObject = DailyScheduleListUserItemRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
  }),
});

const DailyScheduleListObjectRef = gqlSchemaBuilder.objectRef<DailyScheduleListReturnType>("DailyScheduleList");

export const DailyScheduleListPothosObject = DailyScheduleListObjectRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    studentTime: t.exposeString("studentTime"),
    teacherTime: t.exposeString("teacherTime"),
    yourTime: t.exposeString("yourTime"),
    duration: t.exposeInt("duration"),
    scheduledStartAt: t.expose("scheduledStartAt", { type: "DateTime" }),
    scheduledEndAt: t.expose("scheduledEndAt", { type: "DateTime" }),
    status: t.expose("status", { type: ClassExecutionStatePothosObject }),
    ...classExecutionFields(t),
    student: t.expose("student", { type: DailyScheduleListUserItemObject }),
    teacher: t.expose("teacher", { type: DailyScheduleListUserItemObject }),
    courseName: t.exposeString("courseName", { nullable: true }),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    teacherTimezone: t.expose("teacherTimezone", { type: IanaTimezonePothosObject, nullable: true }),
    studentTimezone: t.expose("studentTimezone", { type: IanaTimezonePothosObject, nullable: true }),
  }),
});

export const AdminDashboardScheduleInputPothosObject = gqlSchemaBuilder
  .inputRef<AdminDashboardScheduleInput>("AdminDashboardScheduleInput")
  .implement({
    fields: t => ({
      date: t.string({ required: true }),
      teacherId: t.string(),
      search: t.string(),
      metricFilter: t.string(),
      paginationArgs: t.field({ type: PaginationArgsObject, required: false }),
    }),
  });

const AdminDashboardScheduleResultRef =
  gqlSchemaBuilder.objectRef<AdminDashboardScheduleReturnType>("AdminDashboardScheduleResult");

export const AdminDashboardScheduleResultPothosObject = AdminDashboardScheduleResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    totalCount: t.exposeInt("totalCount"),
    metrics: t.expose("metrics", { type: DailyScheduleMetricsPothosObject }),
    rows: t.expose("rows", { type: [DailyScheduleListPothosObject] }),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

const RescheduleTrackingRowRef = gqlSchemaBuilder.objectRef<RescheduleTrackingRow>("RescheduleTrackingRow");

export const RescheduleTrackingRowPothosObject = RescheduleTrackingRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    originalClassId: t.exposeString("originalClassId", { nullable: true }),
    teacherId: t.exposeString("teacherId"),
    teacherName: t.exposeString("teacherName"),
    teacherAvatarUrl: t.exposeString("teacherAvatarUrl", { nullable: true }),
    studentId: t.exposeString("studentId"),
    studentName: t.exposeString("studentName"),
    scheduledStartAt: t.expose("scheduledStartAt", { type: "DateTime" }),
    scheduledEndAt: t.expose("scheduledEndAt", { type: "DateTime" }),
    status: t.expose("status", { type: LeaveRequestStatusPothosObject }),
    dateLabel: t.expose("dateLabel", { type: RescheduleDateLabelPothosObject }),
    remarks: t.exposeString("remarks", { nullable: true }),
  }),
});

const RescheduleTrackingMetricsRef = gqlSchemaBuilder.objectRef<RescheduleTrackingMetrics>("RescheduleTrackingMetrics");

export const RescheduleTrackingMetricsPothosObject = RescheduleTrackingMetricsRef.implement({
  fields: t => ({
    ...classSessionMetricsFields(t),
    approved: t.exposeInt("approved"),
    cancelled: t.exposeInt("cancelled"),
  }),
});

export const RescheduleTrackingInputPothosObject = gqlSchemaBuilder
  .inputRef<RescheduleTrackingInput>("RescheduleTrackingInput")
  .implement({
    fields: t => ({
      search: t.string(),
      status: t.field({ type: LeaveRequestStatusPothosObject, required: false }),
    }),
  });

const RescheduleTrackingResultRef =
  gqlSchemaBuilder.objectRef<RescheduleTrackingPaginatedResult>("RescheduleTrackingResult");
export const RescheduleTrackingResultPothosObject = RescheduleTrackingResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [RescheduleTrackingRowRef] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

// ─── Status Tracking Schedule Row ─────────────────────────────────────────────

/**
 * GraphQL object type representing a single class instance row in the
 * Status Tracking admin dashboard. Returned by the statusTrackingSchedule query.
 *
 * Fields include student status and isFrozen flag to support the
 * frontend's mapToSessionStatus() logic in StatusTrackingContainer.
 */
const StatusTrackingScheduleRowRef = gqlSchemaBuilder.objectRef<StatusTrackingScheduleRow>("StatusTrackingScheduleRow");

export const StatusTrackingScheduleRowPothosObject = StatusTrackingScheduleRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    studentId: t.exposeString("studentId"),
    studentName: t.exposeString("studentName"),
    studentInitials: t.exposeString("studentInitials"),
    studentAvatarUrl: t.exposeString("studentAvatarUrl", { nullable: true }),
    studentStatus: t.expose("studentStatus", { type: StudentStatusPothosObject }),
    teacherId: t.exposeString("teacherId"),
    teacherName: t.exposeString("teacherName"),
    teacherAvatarUrl: t.exposeString("teacherAvatarUrl", { nullable: true }),
    courseName: t.exposeString("courseName", { nullable: true }),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    scheduledStartAt: t.expose("scheduledStartAt", { type: "DateTime" }),
    scheduledEndAt: t.expose("scheduledEndAt", { type: "DateTime" }),
    durationMinutes: t.exposeInt("durationMinutes"),
    ...classExecutionFields(t),
  }),
});

// ─── Status Tracking Schedule Query ───────────────────────────────────────────

gqlSchemaBuilder.queryField("statusTrackingSchedule", t =>
  t.field({
    type: [StatusTrackingScheduleRowRef],
    args: {
      date: t.arg.string({ required: true }),
      search: t.arg.string({ required: false }),
      viewerTimezone: t.arg({ type: IanaTimezonePothosObject, required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      const date = new Date(args.date);
      return ScheduleQueryService.getStatusTrackingSchedule(ctx.user?.id ?? "", date, tErrors, {
        search: args.search ?? undefined,
        viewerTimezone: args.viewerTimezone ?? undefined,
      });
    },
  })
);
