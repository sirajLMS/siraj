import type { StudentUpcomingClass, StudentUpcomingClassesResult } from "@/backend/types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { ClassExecutionStatePothosObject, StudentStatusPothosObject } from "./enum.pothos";

const StudentUpcomingClassRef = gqlSchemaBuilder.objectRef<StudentUpcomingClass>("StudentUpcomingClass");

export const StudentUpcomingClassPothosObject = StudentUpcomingClassRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    instructor: t.exposeString("instructor"),
    scheduledStartAt: t.expose("scheduledStartAt", { type: "DateTime" }),
    scheduledEndAt: t.expose("scheduledEndAt", { type: "DateTime" }),
    durationMinutes: t.exposeInt("durationMinutes"),
    executionState: t.expose("executionState", { type: ClassExecutionStatePothosObject }),
    isFrozen: t.exposeBoolean("isFrozen"),
  }),
});

const StudentUpcomingClassesResultRef =
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
