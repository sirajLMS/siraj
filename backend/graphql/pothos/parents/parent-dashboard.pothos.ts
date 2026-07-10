import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  BookingStatusPothosObject,
  ClassExecutionStatePothosObject,
  ClassOutcomePothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { PageInfoObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import type {
  ParentDashboardMetricsReturnType,
  ParentDashboardMetricsType,
  ParentDashboardSchedulePaginatedResult,
  ParentDashboardScheduleRow,
  StudentProgressReturnType,
  WorkshopPromoReturnType,
} from "@/backend/types";

const ParentDashboardScheduleRowRef =
  gqlSchemaBuilder.objectRef<ParentDashboardScheduleRow>("ParentDashboardScheduleRow");

export const ParentDashboardScheduleRowPothosObject = ParentDashboardScheduleRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    studentId: t.exposeString("studentId"),
    studentName: t.exposeString("studentName"),
    studentInitials: t.exposeString("studentInitials"),
    studentAvatarUrl: t.exposeString("studentAvatarUrl", { nullable: true }),
    teacherId: t.exposeString("teacherId"),
    teacherName: t.exposeString("teacherName"),
    teacherAvatarUrl: t.exposeString("teacherAvatarUrl", { nullable: true }),
    scheduledStartAt: t.expose("scheduledStartAt", { type: "DateTime" }),
    scheduledEndAt: t.expose("scheduledEndAt", { type: "DateTime" }),
    durationMinutes: t.exposeInt("durationMinutes"),
    bookingStatus: t.expose("bookingStatus", { type: BookingStatusPothosObject }),
    executionState: t.expose("executionState", { type: ClassExecutionStatePothosObject }),
    outcome: t.expose("outcome", { type: ClassOutcomePothosObject }),
    meetingJoinUrl: t.exposeString("meetingJoinUrl", { nullable: true }),
    classTimeFormatted: t.exposeString("classTimeFormatted"),
  }),
});

const ParentDashboardScheduleResultRef = gqlSchemaBuilder.objectRef<ParentDashboardSchedulePaginatedResult>(
  "ParentDashboardScheduleResult"
);

export const ParentDashboardScheduleResultPothosObject = ParentDashboardScheduleResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [ParentDashboardScheduleRowRef] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

const ParentDashboardMetricsRef = gqlSchemaBuilder.objectRef<ParentDashboardMetricsType>("ParentDashboardMetrics");

export const ParentDashboardMetricsPothosObject = ParentDashboardMetricsRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    totalStudents: t.exposeInt("totalStudents"),
    todaysClasses: t.exposeInt("todaysClasses"),
    pendingInvoicesCount: t.exposeInt("pendingInvoicesCount"),
    pendingInvoicesAmount: t.exposeString("pendingInvoicesAmount"),
    performanceAvg: t.exposeInt("performanceAvg"),
    performanceAvgMobile: t.exposeInt("performanceAvgMobile"),
    pendingMessages: t.exposeInt("pendingMessages"),
  }),
});

const StudentProgressRef = gqlSchemaBuilder.objectRef<StudentProgressReturnType>("StudentProgress");

export const StudentProgressPothosObject = StudentProgressRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    completionPercent: t.exposeInt("completionPercent"),
  }),
});

const WorkshopPromoRef = gqlSchemaBuilder.objectRef<WorkshopPromoReturnType>("WorkshopPromo");

export const WorkshopPromoPothosObject = WorkshopPromoRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    title: t.exposeString("title"),
    description: t.exposeString("description"),
    imageUrl: t.exposeString("imageUrl"),
  }),
});

const ParentDashboardMetricsResultRef =
  gqlSchemaBuilder.objectRef<ParentDashboardMetricsReturnType>("ParentDashboardMetricsResult");

export const ParentDashboardMetricsResultPothosObject = ParentDashboardMetricsResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    metrics: t.expose("metrics", { type: ParentDashboardMetricsRef }),
    studentProgress: t.expose("studentProgress", { type: [StudentProgressRef] }),
    workshopPromo: t.expose("workshopPromo", { type: WorkshopPromoRef, nullable: true }),
  }),
});
