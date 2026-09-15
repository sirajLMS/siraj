import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AppLanguagePothosObject,
  CurrencyCodePothosObject,
  GenderPothosObject,
  StudentStatusPothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { StudentClassHistoryPothosObject } from "@/backend/graphql/pothos/students/student-history.pothos";
import { StudentUpcomingClassesResultPothosObject } from "@/backend/graphql/pothos/students/student-status.pothos";
import type { StudentProfileEditInput, StudentProfileReturnType } from "@/backend/types";

export const StudentProfileRef = gqlSchemaBuilder.objectRef<StudentProfileReturnType>("StudentProfile");

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
    timezone: t.expose("timezone", { type: "IanaTimezone", nullable: true }),
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

export const StudentProfileEditInputPothosObject = gqlSchemaBuilder
  .inputRef<StudentProfileEditInput>("StudentProfileEditInput")
  .implement({
    fields: t => ({
      studentId: t.id({ required: false }),
      phone: t.string({ required: false, directives: { constraint: { maxLength: 50 } } }),
      timezone: t.string({ required: false, directives: { constraint: { maxLength: 50 } } }),
      displayCurrency: t.field({ type: CurrencyCodePothosObject, required: false }),
      dateOfBirth: t.field({ type: "DateTime", required: false }),
      gender: t.field({ type: GenderPothosObject, required: false }),
      language: t.field({ type: AppLanguagePothosObject, required: false }),
      timezoneOverride: t.string({ required: false, directives: { constraint: { maxLength: 50 } } }),
      avatarUrl: t.string({ required: false, directives: { constraint: { maxLength: 2048 } } }),
      parentPhone: t.string({ required: false, directives: { constraint: { maxLength: 50 } } }),
    }),
  });
