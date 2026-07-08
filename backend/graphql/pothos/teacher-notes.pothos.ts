import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
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
  fields: t => ({
    title: t.string({ required: true, directives: { constraint: { maxLength: 255 } } }),
    body: t.string({ required: false, directives: { constraint: { maxLength: 10000 } } }),
    isPublished: t.boolean({ required: false }),
    priority: t.int({ required: false }),
    startsAt: t.field({ type: "DateTime", required: false }),
    expiresAt: t.field({ type: "DateTime", required: false }),
  }),
});

export const UpdateTeacherNoteInputPothos = gqlSchemaBuilder.inputType("UpdateTeacherNoteInput", {
  fields: t => ({
    title: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
    body: t.string({ required: false, directives: { constraint: { maxLength: 10000 } } }),
    isPublished: t.boolean({ required: false }),
    priority: t.int({ required: false }),
    startsAt: t.field({ type: "DateTime", required: false }),
    expiresAt: t.field({ type: "DateTime", required: false }),
  }),
});
