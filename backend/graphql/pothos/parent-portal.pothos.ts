import type {
  ParentAssignedStudentReturnType,
  ParentAssignedStudentsResult,
  ParentOwnProfileReturnType,
} from "@/backend/types/parent.types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

const ParentAssignedStudentRef = gqlSchemaBuilder.objectRef<ParentAssignedStudentReturnType>("ParentAssignedStudent");

export const ParentAssignedStudentPothosObject = ParentAssignedStudentRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    status: t.exposeString("status"),
    teacherName: t.exposeString("teacherName", { nullable: true }),
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
    skype: t.exposeString("skype", { nullable: true }),
    defaultZoomLink: t.exposeString("defaultZoomLink", { nullable: true }),
  }),
});

export type ParentHandbookUrlDefinition = {
  id: string;
  url: string;
};

const ParentHandbookUrlRef = gqlSchemaBuilder.objectRef<ParentHandbookUrlDefinition>("ParentHandbookUrl");

export const ParentHandbookUrlPothosObject = ParentHandbookUrlRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    url: t.exposeString("url"),
  }),
});
