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
    yourTime: t.exposeString("yourTime"),
    duration: t.exposeInt("duration"),
    status: t.exposeString("status"),
    student: t.expose("student", { type: DailyScheduleListUserItemObject }),
    teacher: t.expose("teacher", { type: DailyScheduleListUserItemObject }),
  }),
});

