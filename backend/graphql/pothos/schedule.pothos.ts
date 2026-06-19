import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

export type DailyScheduleMetricsDefinition = {
  id: string;
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

const DailyScheduleMetricsObjectRef =
  gqlSchemaBuilder.objectRef<DailyScheduleMetricsDefinition>("DailyScheduleMetrics");

export const DailyScheduleMetricsPothosObject = DailyScheduleMetricsObjectRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
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
  status: string;
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
    status: t.exposeString("status"),
    student: t.expose("student", { type: DailyScheduleListUserItemObject }),
    teacher: t.expose("teacher", { type: DailyScheduleListUserItemObject }),
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
  status: string;
  dateLabel: string;
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
    status: t.exposeString("status"),
    dateLabel: t.exposeString("dateLabel"),
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
  status?: string | null;
  limit?: number | null;
  offset?: number | null;
};

export const RescheduleTrackingInputPothosObject = gqlSchemaBuilder
  .inputRef<RescheduleTrackingInputDefinition>("RescheduleTrackingInput")
  .implement({
    fields: t => ({
      search: t.string(),
      status: t.string(),
      limit: t.int(),
      offset: t.int(),
    }),
  });
