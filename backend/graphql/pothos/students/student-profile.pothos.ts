import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AppLanguagePothosObject,
  GenderPothosObject,
  StudentStatusPothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { StudentClassHistoryPothosObject } from "@/backend/graphql/pothos/students/student-history.pothos";
import { StudentUpcomingClassesResultPothosObject } from "@/backend/graphql/pothos/students/student-status.pothos";
import type { StudentProfileReturnType } from "@/backend/types/students/student-profile.types";

const StudentProfileRef = gqlSchemaBuilder.objectRef<StudentProfileReturnType>("StudentProfile");

export const StudentProfilePothosObject = StudentProfileRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    status: t.expose("status", { type: StudentStatusPothosObject }),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    dateOfBirth: t.expose("dateOfBirth", { type: "DateTime", nullable: true }),
    gender: t.expose("gender", { type: GenderPothosObject, nullable: true }),
    language: t.expose("language", { type: AppLanguagePothosObject, nullable: true }),
    parentId: t.exposeString("parentId", { nullable: true }),
    parentName: t.exposeString("parentName", { nullable: true }),
    primaryTeacherId: t.exposeString("primaryTeacherId", { nullable: true }),
    teacherUserId: t.exposeString("teacherUserId", { nullable: true }),
    teacherName: t.exposeString("teacherName", { nullable: true }),
    hoursPerWeek: t.exposeFloat("hoursPerWeek", { nullable: true }),
    classesRemaining: t.exposeInt("classesRemaining"),
    classesTotal: t.exposeInt("classesTotal"),
    version: t.exposeInt("version"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    upcomingClasses: t.expose("upcomingClasses", {
      type: StudentUpcomingClassesResultPothosObject,
      nullable: true,
    }),
    classHistory: t.expose("classHistory", {
      type: StudentClassHistoryPothosObject,
      nullable: true,
    }),
  }),
});
