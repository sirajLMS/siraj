import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { DisplayAmountPothosObject } from "@/backend/graphql/pothos/billing/fx-display.pothos";
import { EffectiveMeetingPothosObject } from "@/backend/graphql/pothos/meeting/effective-meeting.pothos";
import {
  ClassExecutionStatePothosObject,
  ClassOutcomePothosObject,
  CurrencyCodePothosObject,
  GenderPothosObject,
  IanaTimezonePothosObject,
  StudentStatusPothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import type {
  TeacherAssignedClassesResult,
  TeacherAssignedClassReturnType,
  TeacherAssignedStudentReturnType,
  TeacherAssignedStudentsResult,
  TeacherOwnProfileReturnType,
} from "@/backend/types";

const TeacherAssignedStudentRef =
  gqlSchemaBuilder.objectRef<TeacherAssignedStudentReturnType>("TeacherAssignedStudent");

export const TeacherAssignedStudentPothosObject = TeacherAssignedStudentRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    studentAvatarUrl: t.exposeString("studentAvatarUrl", { nullable: true }),
    parentId: t.exposeString("parentId", { nullable: true }),
    parentUserId: t.exposeString("parentUserId", { nullable: true }),
    parentName: t.exposeString("parentName", { nullable: true }),
    parentAvatarUrl: t.exposeString("parentAvatarUrl", { nullable: true }),
    className: t.exposeString("className", { nullable: true }),
    status: t.expose("status", { type: StudentStatusPothosObject }),
    hoursPerWeek: t.exposeFloat("hoursPerWeek"),
    classesRemaining: t.exposeInt("classesRemaining"),
    classesTotal: t.exposeInt("classesTotal"),
  }),
});

const TeacherAssignedStudentsResultRef = gqlSchemaBuilder.objectRef<TeacherAssignedStudentsResult>(
  "TeacherAssignedStudentsResult"
);

export const TeacherAssignedStudentsResultPothosObject = TeacherAssignedStudentsResultRef.implement({
  fields: t => ({
    id: t.string({ resolve: parent => parent.rows[0]?.id ?? "teacher-assigned-students" }),
    rows: t.field({ type: [TeacherAssignedStudentPothosObject], resolve: parent => parent.rows }),
    totalCount: t.exposeInt("totalCount"),
  }),
});

const TeacherOwnProfileRef = gqlSchemaBuilder.objectRef<TeacherOwnProfileReturnType>("TeacherOwnProfile");

export const TeacherOwnProfilePothosObject = TeacherOwnProfileRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    phone: t.exposeString("phone", { nullable: true }),
    nationality: t.exposeString("nationality", { nullable: true }),
    countryCode: t.exposeString("countryCode", { nullable: true }),
    // Unmasked for the owner (the teacher editing their own profile). Admin /
    // other-scope views go through StaffProfileService which masks the value.
    nationalId: t.exposeString("nationalId", { nullable: true }),
    dateOfBirth: t.exposeString("dateOfBirth", { nullable: true }),
    gender: t.expose("gender", { type: GenderPothosObject, nullable: true }),
    address: t.exposeString("address", { nullable: true }),
    qualifications: t.exposeString("qualifications", { nullable: true }),
    timezone: t.expose("timezone", { type: IanaTimezonePothosObject }),
    hourlyRate: t.exposeString("hourlyRate", { nullable: true }),
    rateCurrency: t.expose("rateCurrency", { type: CurrencyCodePothosObject, nullable: true }),
    totalClasses: t.exposeInt("totalClasses"),
    displayAmount: t.expose("displayAmount", { type: DisplayAmountPothosObject, nullable: true }),
  }),
});

const TeacherAssignedClassRef = gqlSchemaBuilder.objectRef<TeacherAssignedClassReturnType>("TeacherAssignedClass");

export const TeacherAssignedClassPothosObject = TeacherAssignedClassRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    studentName: t.exposeString("studentName"),
    scheduledStartAt: t.exposeString("scheduledStartAt"),
    scheduledEndAt: t.exposeString("scheduledEndAt"),
    durationMinutes: t.exposeInt("durationMinutes"),
    executionState: t.expose("executionState", { type: ClassExecutionStatePothosObject }),
    outcome: t.expose("outcome", { type: ClassOutcomePothosObject, nullable: true }),
    isFrozen: t.exposeBoolean("isFrozen"),
    meetingJoinUrl: t.exposeString("meetingJoinUrl", { nullable: true }),
    effectiveMeeting: t.expose("effectiveMeeting", { type: EffectiveMeetingPothosObject, nullable: true }),
  }),
});

const TeacherAssignedClassesResultRef =
  gqlSchemaBuilder.objectRef<TeacherAssignedClassesResult>("TeacherAssignedClassesResult");

export const TeacherAssignedClassesResultPothosObject = TeacherAssignedClassesResultRef.implement({
  fields: t => ({
    id: t.string({ resolve: parent => parent.rows[0]?.id ?? "teacher-assigned-classes" }),
    rows: t.field({ type: [TeacherAssignedClassPothosObject], resolve: parent => parent.rows }),
    totalCount: t.exposeInt("totalCount"),
  }),
});
