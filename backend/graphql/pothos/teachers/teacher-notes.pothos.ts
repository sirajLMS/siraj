import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { teacherNoteInputFields } from "@/backend/graphql/pothos/teachers/__shared__/teacherNoteFieldHelpers";
import type { SupportContactReturnType, TeacherImportantNoteReturnType } from "@/backend/types";

const TeacherImportantNoteRef = gqlSchemaBuilder.objectRef<TeacherImportantNoteReturnType>("TeacherImportantNote");

export const TeacherImportantNotePothosObject = TeacherImportantNoteRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    title: t.exposeString("title"),
    body: t.exposeString("body", { nullable: true }),
    isPublished: t.exposeBoolean("isPublished", { nullable: true }),
    priority: t.exposeInt("priority"),
    teacherId: t.exposeString("teacherId", { nullable: true }),
    startsAt: t.expose("startsAt", { type: "DateTime", nullable: true }),
    expiresAt: t.expose("expiresAt", { type: "DateTime", nullable: true }),
  }),
});

const SupportContactRef = gqlSchemaBuilder.objectRef<SupportContactReturnType>("SupportContact");

export const SupportContactPothosObject = SupportContactRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    role: t.exposeString("role", { nullable: true }),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    phone: t.exposeString("phone", { nullable: true }),
  }),
});

export const CreateTeacherNoteInputPothos = gqlSchemaBuilder.inputType("CreateTeacherNoteInput", {
  fields: t => teacherNoteInputFields(t, true),
});

export const UpdateTeacherNoteInputPothos = gqlSchemaBuilder.inputType("UpdateTeacherNoteInput", {
  fields: t => teacherNoteInputFields(t, false),
});
