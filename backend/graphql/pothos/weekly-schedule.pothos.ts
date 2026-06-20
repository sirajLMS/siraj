import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

export type WeeklyScheduleClassDefinition = {
  id: string;
  studentName: string;
  studentId: string;
  duration: number;
  startTime: string;
  day: string;
  executionState: string;
  outcome: string;
};

const WeeklyScheduleClassRef = gqlSchemaBuilder.objectRef<WeeklyScheduleClassDefinition>("WeeklyScheduleClass");

export const WeeklyScheduleClassPothosObject = WeeklyScheduleClassRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    studentName: t.exposeString("studentName"),
    studentId: t.exposeString("studentId"),
    duration: t.exposeInt("duration"),
    startTime: t.exposeString("startTime"),
    day: t.exposeString("day"),
    executionState: t.exposeString("executionState"),
    outcome: t.exposeString("outcome"),
  }),
});

export type WeeklyScheduleGridDefinition = {
  id: string;
  teacherId: string;
  weekStart: string;
  weekEnd: string;
  classes: WeeklyScheduleClassDefinition[];
};

const WeeklyScheduleGridRef = gqlSchemaBuilder.objectRef<WeeklyScheduleGridDefinition>("WeeklyScheduleGrid");

export const WeeklyScheduleGridPothosObject = WeeklyScheduleGridRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    teacherId: t.exposeString("teacherId"),
    weekStart: t.exposeString("weekStart"),
    weekEnd: t.exposeString("weekEnd"),
    classes: t.expose("classes", { type: [WeeklyScheduleClassPothosObject] }),
  }),
});

export type WeeklyWorkloadMetricsDefinition = {
  id: string;
  weeklyHoursWorked: string;
  totalMinutes: number;
  classCount: number;
};

const WeeklyWorkloadMetricsRef = gqlSchemaBuilder.objectRef<WeeklyWorkloadMetricsDefinition>("WeeklyWorkloadMetrics");

export const WeeklyWorkloadMetricsPothosObject = WeeklyWorkloadMetricsRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    weeklyHoursWorked: t.exposeString("weeklyHoursWorked"),
    totalMinutes: t.exposeInt("totalMinutes"),
    classCount: t.exposeInt("classCount"),
  }),
});
