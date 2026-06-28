import type { StudentUpcomingClass, StudentUpcomingClassesResult } from "@/backend/types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

const StudentUpcomingClassRef = gqlSchemaBuilder.objectRef<StudentUpcomingClass>("StudentUpcomingClass");

export const StudentUpcomingClassPothosObject = StudentUpcomingClassRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    instructor: t.exposeString("instructor"),
    scheduledStartAt: t.expose("scheduledStartAt", { type: "DateTime" }),
    scheduledEndAt: t.expose("scheduledEndAt", { type: "DateTime" }),
    durationMinutes: t.exposeInt("durationMinutes"),
    executionState: t.exposeString("executionState"),
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
    status: t.exposeString("status"),
    classes: t.expose("classes", { type: [StudentUpcomingClassPothosObject] }),
  }),
});
