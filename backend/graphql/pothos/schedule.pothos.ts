import { ScheduleQueryService } from "@/backend/services/schedule/schedule-query.service";
import type { ClassSessionMetrics, PageInfo, PaginationInput } from "@/backend/types";
import type {
  ClassExecutionState,
  ClassOutcome,
  LeaveRequestStatus,
  RescheduleDateLabel,
  StudentStatus,
} from "@/shared/lib/enum";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import {
  ClassExecutionStatePothosObject,
  ClassOutcomePothosObject,
  LeaveRequestStatusPothosObject,
  RescheduleDateLabelPothosObject,
  StudentStatusPothosObject,
} from "./enum.pothos";
import { PageInfoObject, PaginationArgsObject } from "./pagination.objects";

const DailyScheduleMetricsObjectRef = gqlSchemaBuilder.objectRef<ClassSessionMetrics>("DailyScheduleMetrics");

export const DailyScheduleMetricsPothosObject = DailyScheduleMetricsObjectRef.implement({
  fields: t => ({
    id: t.exposeString("id", { nullable: true }),
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

export type DailyScheduleListUserItem = {
  id: string;
  name: string;
};

const DailyScheduleListUserItemRef = gqlSchemaBuilder.objectRef<DailyScheduleListUserItem>("DailyScheduleListUserItem");
const DailyScheduleListUserItemObject = DailyScheduleListUserItemRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
  }),
});

export type DailyScheduleListDefinition = {
  id: string;
  studentTime: string;
  teacherTime: string;
  yourTime: string;
  duration: number;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  status: ClassExecutionState;
  outcome: ClassOutcome;
  executionState: ClassExecutionState;
  student: DailyScheduleListUserItem;
  teacher: DailyScheduleListUserItem;
};

const DailyScheduleListObjectRef = gqlSchemaBuilder.objectRef<DailyScheduleListDefinition>("DailyScheduleList");

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
    outcome: t.expose("outcome", { type: ClassOutcomePothosObject }),
    executionState: t.expose("executionState", { type: ClassExecutionStatePothosObject }),
    student: t.expose("student", { type: DailyScheduleListUserItemObject }),
    teacher: t.expose("teacher", { type: DailyScheduleListUserItemObject }),
  }),
});

export type AdminDashboardScheduleInputDefinition = {
  date: string;
  teacherId?: string | null;
  search?: string | null;
  metricFilter?: string | null;
  paginationArgs?: PaginationInput | null;
};

export const AdminDashboardScheduleInputPothosObject = gqlSchemaBuilder
  .inputRef<AdminDashboardScheduleInputDefinition>("AdminDashboardScheduleInput")
  .implement({
    fields: t => ({
      date: t.string({ required: true }),
      teacherId: t.string(),
      search: t.string(),
      metricFilter: t.string(),
      paginationArgs: t.field({ type: PaginationArgsObject, required: false }),
    }),
  });

export type AdminDashboardScheduleResultDefinition = {
  id: string;
  totalCount: number;
  metrics: ClassSessionMetrics;
  rows: DailyScheduleListDefinition[];
  pageInfo: PageInfo | null;
};

const AdminDashboardScheduleResultRef =
  gqlSchemaBuilder.objectRef<AdminDashboardScheduleResultDefinition>("AdminDashboardScheduleResult");

export const AdminDashboardScheduleResultPothosObject = AdminDashboardScheduleResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    totalCount: t.exposeInt("totalCount"),
    metrics: t.expose("metrics", { type: DailyScheduleMetricsPothosObject }),
    rows: t.expose("rows", { type: [DailyScheduleListPothosObject] }),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

export type RescheduleTrackingRowDefinition = {
  id: string;
  originalClassId: string | null;
  teacherId: string;
  teacherName: string;
  teacherAvatarUrl: string | null;
  studentId: string;
  studentName: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  status: LeaveRequestStatus;
  dateLabel: RescheduleDateLabel;
  remarks: string | null;
};

const RescheduleTrackingRowRef = gqlSchemaBuilder.objectRef<RescheduleTrackingRowDefinition>("RescheduleTrackingRow");

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

export type RescheduleTrackingMetricsDefinition = {
  id: string;
  pending: number;
  approved: number;
  leave: number;
  rescheduled: number;
  cancelled: number;
};

const RescheduleTrackingMetricsRef =
  gqlSchemaBuilder.objectRef<RescheduleTrackingMetricsDefinition>("RescheduleTrackingMetrics");

export const RescheduleTrackingMetricsPothosObject = RescheduleTrackingMetricsRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    pending: t.exposeInt("pending"),
    approved: t.exposeInt("approved"),
    leave: t.exposeInt("leave"),
    rescheduled: t.exposeInt("rescheduled"),
    cancelled: t.exposeInt("cancelled"),
  }),
});

export type RescheduleTrackingInputDefinition = {
  search?: string | null;
  status?: LeaveRequestStatus | null;
};

export const RescheduleTrackingInputPothosObject = gqlSchemaBuilder
  .inputRef<RescheduleTrackingInputDefinition>("RescheduleTrackingInput")
  .implement({
    fields: t => ({
      search: t.string(),
      status: t.field({ type: LeaveRequestStatusPothosObject, required: false }),
    }),
  });

export type RescheduleTrackingResultDefinition = {
  id: string;
  rows: RescheduleTrackingRowDefinition[];
  totalCount: number;
  pageInfo: PageInfo | null;
};

const RescheduleTrackingResultRef =
  gqlSchemaBuilder.objectRef<RescheduleTrackingResultDefinition>("RescheduleTrackingResult");
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
export type StatusTrackingScheduleRowDefinition = {
  id: string;
  studentId: string;
  studentName: string;
  studentInitials: string;
  studentStatus: StudentStatus;
  teacherId: string;
  teacherName: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  executionState: ClassExecutionState;
  outcome: ClassOutcome;
  isFrozen: boolean;
};

const StatusTrackingScheduleRowRef =
  gqlSchemaBuilder.objectRef<StatusTrackingScheduleRowDefinition>("StatusTrackingScheduleRow");

export const StatusTrackingScheduleRowPothosObject = StatusTrackingScheduleRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    studentId: t.exposeString("studentId"),
    studentName: t.exposeString("studentName"),
    studentInitials: t.exposeString("studentInitials"),
    studentStatus: t.expose("studentStatus", { type: StudentStatusPothosObject }),
    teacherId: t.exposeString("teacherId"),
    teacherName: t.exposeString("teacherName"),
    scheduledStartAt: t.expose("scheduledStartAt", { type: "DateTime" }),
    scheduledEndAt: t.expose("scheduledEndAt", { type: "DateTime" }),
    durationMinutes: t.exposeInt("durationMinutes"),
    executionState: t.expose("executionState", { type: ClassExecutionStatePothosObject }),
    outcome: t.expose("outcome", { type: ClassOutcomePothosObject }),
    isFrozen: t.exposeBoolean("isFrozen"),
  }),
});

// ─── Status Tracking Schedule Query ───────────────────────────────────────────

gqlSchemaBuilder.queryField("statusTrackingSchedule", t =>
  t.field({
    type: [StatusTrackingScheduleRowRef],
    args: {
      date: t.arg.string({ required: true }),
      search: t.arg.string({ required: false }),
      viewerTimezone: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const date = new Date(args.date);
      return ScheduleQueryService.getStatusTrackingSchedule(
        ctx.user?.id ?? "",
        date,
        {
          search: args.search ?? undefined,
          viewerTimezone: args.viewerTimezone ?? undefined,
        },
        ctx.locale
      );
    },
  })
);
