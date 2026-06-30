import type {
  PageInfo,
  ParentDashboardMetricsType,
  ParentDashboardScheduleRow,
  StudentProgressReturnType,
  WorkshopPromoReturnType,
} from "@/backend/types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { BookingStatusPothosObject, ClassExecutionStatePothosObject, ClassOutcomePothosObject } from "./enum.pothos";
import { PageInfoObject } from "./pagination.objects";

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
    scheduledStartAt: t.expose("scheduledStartAt", { type: "DateTime" }),
    scheduledEndAt: t.expose("scheduledEndAt", { type: "DateTime" }),
    durationMinutes: t.exposeInt("durationMinutes"),
    bookingStatus: t.expose("bookingStatus", { type: BookingStatusPothosObject }),
    executionState: t.expose("executionState", { type: ClassExecutionStatePothosObject }),
    outcome: t.expose("outcome", { type: ClassOutcomePothosObject }),
    zoomMeetingUrl: t.exposeString("zoomMeetingUrl", { nullable: true }),
    classTimeFormatted: t.exposeString("classTimeFormatted"),
  }),
});

export type ParentDashboardScheduleResultDefinition = {
  id: string;
  rows: ParentDashboardScheduleRow[];
  totalCount: number;
  pageInfo: PageInfo | null;
};

const ParentDashboardScheduleResultRef = gqlSchemaBuilder.objectRef<ParentDashboardScheduleResultDefinition>(
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

export type ParentDashboardMetricsResultDefinition = {
  id: string;
  metrics: ParentDashboardMetricsType;
  studentProgress: StudentProgressReturnType[];
  workshopPromo: WorkshopPromoReturnType | null;
};

const ParentDashboardMetricsResultRef =
  gqlSchemaBuilder.objectRef<ParentDashboardMetricsResultDefinition>("ParentDashboardMetricsResult");

export const ParentDashboardMetricsResultPothosObject = ParentDashboardMetricsResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    metrics: t.expose("metrics", { type: ParentDashboardMetricsRef }),
    studentProgress: t.expose("studentProgress", { type: [StudentProgressRef] }),
    workshopPromo: t.expose("workshopPromo", { type: WorkshopPromoRef, nullable: true }),
  }),
});
