import type {
  WeeklyScheduleClassReturnType,
  WeeklyScheduleGridReturnType,
  WeeklyWorkloadMetricsReturnType,
} from "@/backend/types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

const WeeklyScheduleClassRef = gqlSchemaBuilder.objectRef<WeeklyScheduleClassReturnType>("WeeklyScheduleClass");

export const WeeklyScheduleClassPothosObject = WeeklyScheduleClassRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    studentName: t.exposeString("studentName"),
    studentId: t.exposeString("studentId"),
    duration: t.exposeInt("duration"),
    startTime: t.exposeString("startTime"),
    day: t.exposeString("day"),
    executionState: t.exposeString("executionState", { nullable: true }),
    outcome: t.exposeString("outcome", { nullable: true }),
    subjectId: t.exposeString("subjectId", { nullable: true }),
    subjectName: t.exposeString("subjectName", { nullable: true }),
    classType: t.exposeString("classType", { nullable: true }),
  }),
});

const WeeklyScheduleGridRef = gqlSchemaBuilder.objectRef<WeeklyScheduleGridReturnType>("WeeklyScheduleGrid");

export const WeeklyScheduleGridPothosObject = WeeklyScheduleGridRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    teacherId: t.exposeString("teacherId"),
    weekStart: t.exposeString("weekStart"),
    weekEnd: t.exposeString("weekEnd"),
    teacherName: t.exposeString("teacherName", { nullable: true }),
    classes: t.expose("classes", { type: [WeeklyScheduleClassPothosObject] }),
  }),
});

const WeeklyWorkloadMetricsRef = gqlSchemaBuilder.objectRef<WeeklyWorkloadMetricsReturnType>("WeeklyWorkloadMetrics");

export const WeeklyWorkloadMetricsPothosObject = WeeklyWorkloadMetricsRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    weeklyHoursWorked: t.exposeString("weeklyHoursWorked"),
    totalMinutes: t.exposeInt("totalMinutes"),
    classCount: t.exposeInt("classCount"),
  }),
});
