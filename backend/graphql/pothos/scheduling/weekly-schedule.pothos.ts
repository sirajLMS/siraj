import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { EffectiveMeetingPothosObject } from "@/backend/graphql/pothos/meeting/effective-meeting.pothos";
import {
  ClassExecutionStatePothosObject,
  ClassOutcomePothosObject,
  ClassTypePothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import type {
  WeeklyScheduleClassReturnType,
  WeeklyScheduleGridReturnType,
  WeeklyWorkloadMetricsReturnType,
} from "@/backend/types";

const WeeklyScheduleClassRef = gqlSchemaBuilder.objectRef<WeeklyScheduleClassReturnType>("WeeklyScheduleClass");

export const WeeklyScheduleClassPothosObject = WeeklyScheduleClassRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    studentName: t.exposeString("studentName"),
    studentId: t.exposeString("studentId"),
    duration: t.exposeInt("duration"),
    startTime: t.exposeString("startTime"),
    day: t.exposeString("day"),
    executionState: t.expose("executionState", { type: ClassExecutionStatePothosObject, nullable: true }),
    outcome: t.expose("outcome", { type: ClassOutcomePothosObject, nullable: true }),
    subjectId: t.exposeString("subjectId", { nullable: true }),
    subjectName: t.exposeString("subjectName", { nullable: true }),
    classType: t.expose("classType", { type: ClassTypePothosObject, nullable: true }),
    meetingJoinUrl: t.exposeString("meetingJoinUrl", { nullable: true }),
    effectiveMeeting: t.expose("effectiveMeeting", { type: EffectiveMeetingPothosObject, nullable: true }),
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
