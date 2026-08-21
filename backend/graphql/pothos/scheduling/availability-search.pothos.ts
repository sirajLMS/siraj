import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AvailabilitySearchSortByPothosObject,
  DayOfWeekPothosObject,
  GenderPothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { PageInfoObject, PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import type {
  AvailabilitySearchResult,
  AvailabilitySearchTeacher,
  CrossStaffSearchInput,
  TeacherAvailabilityGap,
} from "@/backend/types";

const TeacherAvailabilityGapRef = gqlSchemaBuilder.objectRef<TeacherAvailabilityGap>("TeacherAvailabilityGap");

export const TeacherAvailabilityGapPothosObject = TeacherAvailabilityGapRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    teacherId: t.exposeString("teacherId"),
    teacherName: t.exposeString("teacherName"),
    teacherGender: t.exposeString("teacherGender", { nullable: true }),
    dayOfWeek: t.expose("dayOfWeek", { type: DayOfWeekPothosObject }),
    calendarDate: t.exposeString("calendarDate"),
    gapStartTime: t.exposeString("gapStartTime"),
    gapEndTime: t.exposeString("gapEndTime"),
    timezone: t.expose("timezone", { type: "IanaTimezone" }),
  }),
});

const AvailabilitySearchTeacherRef = gqlSchemaBuilder.objectRef<AvailabilitySearchTeacher>("AvailabilitySearchTeacher");

export const AvailabilitySearchTeacherPothosObject = AvailabilitySearchTeacherRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    gender: t.expose("gender", { type: GenderPothosObject, nullable: true }),
    timezone: t.expose("timezone", { type: "IanaTimezone" }),
    availableDaysCount: t.exposeInt("availableDaysCount"),
    gaps: t.expose("gaps", { type: [TeacherAvailabilityGapPothosObject] }),
  }),
});

const AvailabilitySearchResultRef = gqlSchemaBuilder.objectRef<AvailabilitySearchResult>("AvailabilitySearchResult");

export const AvailabilitySearchResultPothosObject = AvailabilitySearchResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    teachers: t.expose("teachers", { type: [AvailabilitySearchTeacherPothosObject] }),
    totalGaps: t.exposeInt("totalGaps"),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

export const AvailabilitySearchInputPothosObject = gqlSchemaBuilder
  .inputRef<CrossStaffSearchInput>("AvailabilitySearchInput")
  .implement({
    fields: t => ({
      fromTime: t.string({ required: true, directives: { constraint: { maxLength: 20 } } }),
      toTime: t.string({ required: true, directives: { constraint: { maxLength: 20 } } }),
      fromDate: t.string({ required: false, directives: { constraint: { maxLength: 20 } } }),
      toDate: t.string({ required: false, directives: { constraint: { maxLength: 20 } } }),
      gender: t.field({ type: GenderPothosObject, required: false }),
      minAvailableDays: t.int({ required: false, directives: { constraint: { min: 0, max: 365 } } }),
      minTotalGaps: t.int({ required: false, directives: { constraint: { min: 0, max: 365 } } }),
      teacherNameSearch: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      daysOfWeek: t.field({ type: [DayOfWeekPothosObject], required: false }),
      sortBy: t.field({ type: AvailabilitySearchSortByPothosObject, required: false }),
      paginationArgs: t.field({ type: PaginationArgsObject, required: false }),
    }),
  });
