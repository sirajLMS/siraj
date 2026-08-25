import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { StudentStatusPothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import type { ChangeStudentStatusResult, ReassignStudentTeacherResult } from "@/backend/types";

// ─── ReassignStudentTeacherResult Object ─────────────────────────────────────

export const ReassignStudentTeacherResultRef =
  gqlSchemaBuilder.objectRef<ReassignStudentTeacherResult>("ReassignStudentTeacherResult");

export const ReassignStudentTeacherResultPothosObject = ReassignStudentTeacherResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    primaryTeacherId: t.exposeString("primaryTeacherId", { nullable: true }),
    version: t.exposeInt("version"),
  }),
});

// ─── ChangeStudentStatusResult Object ────────────────────────────────────────

export const ChangeStudentStatusResultRef =
  gqlSchemaBuilder.objectRef<ChangeStudentStatusResult>("ChangeStudentStatusResult");

export const ChangeStudentStatusResultPothosObject = ChangeStudentStatusResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    status: t.expose("status", { type: StudentStatusPothosObject }),
    version: t.exposeInt("version"),
  }),
});

// ─── Mutations ───────────────────────────────────────────────────────────────
