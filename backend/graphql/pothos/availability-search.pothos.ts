import type {
  AvailabilitySearchResult,
  AvailabilitySearchTeacher,
  CrossStaffSearchInput,
  TeacherAvailabilityGap,
} from "@/backend/types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { DayOfWeekPothosObject, GenderPothosObject } from "./enum.pothos";

const TeacherAvailabilityGapRef = gqlSchemaBuilder.objectRef<TeacherAvailabilityGap>("TeacherAvailabilityGap");

export const TeacherAvailabilityGapPothosObject = TeacherAvailabilityGapRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    teacherId: t.exposeString("teacherId"),
    teacherName: t.exposeString("teacherName"),
    teacherGender: t.exposeString("teacherGender", { nullable: true }),
    dayOfWeek: t.expose("dayOfWeek", { type: DayOfWeekPothosObject }),
    gapStartTime: t.exposeString("gapStartTime"),
    gapEndTime: t.exposeString("gapEndTime"),
    timezone: t.exposeString("timezone"),
  }),
});

const AvailabilitySearchTeacherRef = gqlSchemaBuilder.objectRef<AvailabilitySearchTeacher>("AvailabilitySearchTeacher");

export const AvailabilitySearchTeacherPothosObject = AvailabilitySearchTeacherRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    gender: t.expose("gender", { type: GenderPothosObject, nullable: true }),
    timezone: t.exposeString("timezone"),
    gaps: t.expose("gaps", { type: [TeacherAvailabilityGapPothosObject] }),
  }),
});

const AvailabilitySearchResultRef = gqlSchemaBuilder.objectRef<AvailabilitySearchResult>("AvailabilitySearchResult");

export const AvailabilitySearchResultPothosObject = AvailabilitySearchResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    teachers: t.expose("teachers", { type: [AvailabilitySearchTeacherPothosObject] }),
    totalGaps: t.exposeInt("totalGaps"),
  }),
});

export const AvailabilitySearchInputPothosObject = gqlSchemaBuilder
  .inputRef<CrossStaffSearchInput>("AvailabilitySearchInput")
  .implement({
    fields: t => ({
      fromTime: t.string({ required: true }),
      toTime: t.string({ required: true }),
      gender: t.field({ type: GenderPothosObject, required: false }),
    }),
  });
