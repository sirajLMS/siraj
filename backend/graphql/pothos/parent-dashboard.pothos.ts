import type { PageInfo } from "@/backend/types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { PageInfoObject } from "./pagination.objects";

export type ParentDashboardScheduleRowDefinition = {
  id: string;
  studentId: string;
  studentName: string;
  studentInitials: string;
  studentAvatarUrl: string | null;
  teacherId: string;
  teacherName: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  bookingStatus: string;
  executionState: string;
  outcome: string;
  zoomMeetingUrl: string | null;
  classTimeFormatted: string;
};

const ParentDashboardScheduleRowRef =
  gqlSchemaBuilder.objectRef<ParentDashboardScheduleRowDefinition>("ParentDashboardScheduleRow");

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
    bookingStatus: t.exposeString("bookingStatus"),
    executionState: t.exposeString("executionState"),
    outcome: t.exposeString("outcome"),
    zoomMeetingUrl: t.exposeString("zoomMeetingUrl", { nullable: true }),
    classTimeFormatted: t.exposeString("classTimeFormatted"),
  }),
});

export type ParentDashboardScheduleResultDefinition = {
  id: string;
  rows: ParentDashboardScheduleRowDefinition[];
  totalCount: number;
  pageInfo: PageInfo | null;
};

const ParentDashboardScheduleResultRef =
  gqlSchemaBuilder.objectRef<ParentDashboardScheduleResultDefinition>("ParentDashboardScheduleResult");

export const ParentDashboardScheduleResultPothosObject = ParentDashboardScheduleResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [ParentDashboardScheduleRowRef] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});
