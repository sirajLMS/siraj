import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { EffectiveMeetingPothosObject } from "@/backend/graphql/pothos/meeting/effective-meeting.pothos";
import {
  ClassExecutionStatePothosObject,
  ClassOutcomePothosObject,
  StudentStatusPothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import type { StudentUpcomingClass, StudentUpcomingClassesResult } from "@/backend/types";

export const StudentUpcomingClassRef = gqlSchemaBuilder.objectRef<StudentUpcomingClass>("StudentUpcomingClass");

export const StudentUpcomingClassPothosObject = StudentUpcomingClassRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    instructor: t.exposeString("instructor"),
    teacherId: t.exposeString("teacherId"),
    teacherAvatarUrl: t.exposeString("teacherAvatarUrl", { nullable: true }),
    subjectId: t.exposeString("subjectId", { nullable: true }),
    subjectName: t.exposeString("subjectName", { nullable: true }),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    scheduledStartAt: t.expose("scheduledStartAt", { type: "DateTime" }),
    scheduledEndAt: t.expose("scheduledEndAt", { type: "DateTime" }),
    durationMinutes: t.exposeInt("durationMinutes"),
    executionState: t.expose("executionState", { type: ClassExecutionStatePothosObject }),
    outcome: t.expose("outcome", { type: ClassOutcomePothosObject }),
    isFrozen: t.exposeBoolean("isFrozen"),
    meetingJoinUrl: t.exposeString("meetingJoinUrl", { nullable: true }),
    effectiveMeeting: t.expose("effectiveMeeting", { type: EffectiveMeetingPothosObject, nullable: true }),
  }),
});

export const StudentUpcomingClassesResultRef =
  gqlSchemaBuilder.objectRef<StudentUpcomingClassesResult>("StudentUpcomingClassesResult");

export const StudentUpcomingClassesResultPothosObject = StudentUpcomingClassesResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    studentId: t.exposeString("studentId"),
    studentName: t.exposeString("studentName"),
    status: t.expose("status", { type: StudentStatusPothosObject }),
    classes: t.expose("classes", { type: [StudentUpcomingClassPothosObject] }),
  }),
});
