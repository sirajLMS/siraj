import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type {
  ParentAssignedStudentReturnType,
  ParentAssignedStudentsResult,
  ParentOwnProfileReturnType,
} from "@/backend/types/parents/parent.types";

const ParentAssignedStudentRef = gqlSchemaBuilder.objectRef<ParentAssignedStudentReturnType>("ParentAssignedStudent");

export const ParentAssignedStudentPothosObject = ParentAssignedStudentRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    studentAvatarUrl: t.exposeString("studentAvatarUrl", { nullable: true }),
    status: t.exposeString("status"),
    primaryTeacherId: t.exposeString("primaryTeacherId", { nullable: true }),
    teacherUserId: t.exposeString("teacherUserId", { nullable: true }),
    teacherName: t.exposeString("teacherName", { nullable: true }),
    teacherAvatarUrl: t.exposeString("teacherAvatarUrl", { nullable: true }),
    hoursPerWeek: t.exposeString("hoursPerWeek"),
    classesRemaining: t.exposeInt("classesRemaining"),
    classesTotal: t.exposeInt("classesTotal"),
  }),
});

const ParentAssignedStudentsResultRef =
  gqlSchemaBuilder.objectRef<ParentAssignedStudentsResult>("ParentAssignedStudentsResult");

export const ParentAssignedStudentsResultPothosObject = ParentAssignedStudentsResultRef.implement({
  fields: t => ({
    id: t.string({ resolve: parent => parent.rows[0]?.id ?? "parent-assigned-students" }),
    rows: t.field({ type: [ParentAssignedStudentPothosObject], resolve: parent => parent.rows }),
    totalCount: t.exposeInt("totalCount"),
  }),
});

const ParentOwnProfileRef = gqlSchemaBuilder.objectRef<ParentOwnProfileReturnType>("ParentOwnProfile");

export const ParentOwnProfilePothosObject = ParentOwnProfileRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    phone: t.exposeString("phone", { nullable: true }),
    facebook: t.exposeString("facebook", { nullable: true }),
    whatsapp: t.exposeString("whatsapp", { nullable: true }),
    twitter: t.exposeString("twitter", { nullable: true }),
    defaultZoomLink: t.exposeString("defaultZoomLink", { nullable: true }),
  }),
});

import type { ParentHandbookUrlReturnType } from "@/backend/types";

const ParentHandbookUrlRef = gqlSchemaBuilder.objectRef<ParentHandbookUrlReturnType>("ParentHandbookUrl");

export const ParentHandbookUrlPothosObject = ParentHandbookUrlRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    url: t.exposeString("url"),
  }),
});
