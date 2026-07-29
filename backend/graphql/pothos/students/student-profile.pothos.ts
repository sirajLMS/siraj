import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AppLanguagePothosObject,
  CurrencyCodePothosObject,
  GenderPothosObject,
  IanaTimezonePothosObject,
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
    timezoneOverride: t.exposeString("timezoneOverride", { nullable: true }),
    email: t.exposeString("email", { nullable: true }),
    phone: t.exposeString("phone", { nullable: true }),
    timezone: t.expose("timezone", { type: IanaTimezonePothosObject, nullable: true }),
    displayCurrency: t.expose("displayCurrency", { type: CurrencyCodePothosObject, nullable: true }),
    parentId: t.exposeString("parentId", { nullable: true }),
    parentUserId: t.exposeString("parentUserId", { nullable: true }),
    parentName: t.exposeString("parentName", { nullable: true }),
    parentEmail: t.exposeString("parentEmail", { nullable: true }),
    parentPhone: t.exposeString("parentPhone", { nullable: true }),
    isAssociatedViewer: t.exposeBoolean("isAssociatedViewer"),
    isOwnStudentProfile: t.exposeBoolean("isOwnStudentProfile"),
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
