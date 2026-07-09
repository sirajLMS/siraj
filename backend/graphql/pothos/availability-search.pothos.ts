import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AvailabilitySearchSortByPothosObject,
  DayOfWeekPothosObject,
  GenderPothosObject,
} from "@/backend/graphql/pothos/enum.pothos";
import { PageInfoObject, PaginationArgsObject } from "@/backend/graphql/pothos/pagination.objects";
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
      fromTime: t.string({ required: true }),
      toTime: t.string({ required: true }),
      fromDate: t.string({ required: false }),
      toDate: t.string({ required: false }),
      gender: t.field({ type: GenderPothosObject, required: false }),
      minAvailableDays: t.int({ required: false }),
      minTotalGaps: t.int({ required: false }),
      teacherNameSearch: t.string({ required: false }),
      daysOfWeek: t.field({ type: [DayOfWeekPothosObject], required: false }),
      sortBy: t.field({ type: AvailabilitySearchSortByPothosObject, required: false }),
      paginationArgs: t.field({ type: PaginationArgsObject, required: false }),
    }),
  });
