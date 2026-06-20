import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

export type TeacherAvailabilityGapDefinition = {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherGender: string | null;
  dayOfWeek: string;
  gapStartTime: string;
  gapEndTime: string;
  timezone: string;
};

const TeacherAvailabilityGapRef =
  gqlSchemaBuilder.objectRef<TeacherAvailabilityGapDefinition>("TeacherAvailabilityGap");

export const TeacherAvailabilityGapPothosObject = TeacherAvailabilityGapRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    teacherId: t.exposeString("teacherId"),
    teacherName: t.exposeString("teacherName"),
    teacherGender: t.exposeString("teacherGender", { nullable: true }),
    dayOfWeek: t.exposeString("dayOfWeek"),
    gapStartTime: t.exposeString("gapStartTime"),
    gapEndTime: t.exposeString("gapEndTime"),
    timezone: t.exposeString("timezone"),
  }),
});

export type AvailabilitySearchTeacherDefinition = {
  id: string;
  name: string;
  gender: string | null;
  timezone: string;
  gaps: TeacherAvailabilityGapDefinition[];
};

const AvailabilitySearchTeacherRef =
  gqlSchemaBuilder.objectRef<AvailabilitySearchTeacherDefinition>("AvailabilitySearchTeacher");

export const AvailabilitySearchTeacherPothosObject = AvailabilitySearchTeacherRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    gender: t.exposeString("gender", { nullable: true }),
    timezone: t.exposeString("timezone"),
    gaps: t.expose("gaps", { type: [TeacherAvailabilityGapPothosObject] }),
  }),
});

export type AvailabilitySearchResultDefinition = {
  id: string;
  teachers: AvailabilitySearchTeacherDefinition[];
  totalGaps: number;
};

const AvailabilitySearchResultRef =
  gqlSchemaBuilder.objectRef<AvailabilitySearchResultDefinition>("AvailabilitySearchResult");

export const AvailabilitySearchResultPothosObject = AvailabilitySearchResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    teachers: t.expose("teachers", { type: [AvailabilitySearchTeacherPothosObject] }),
    totalGaps: t.exposeInt("totalGaps"),
  }),
});

export type AvailabilitySearchInputDefinition = {
  fromTime: string;
  toTime: string;
  gender?: string | null;
};

export const AvailabilitySearchInputPothosObject = gqlSchemaBuilder
  .inputRef<AvailabilitySearchInputDefinition>("AvailabilitySearchInput")
  .implement({
    fields: t => ({
      fromTime: t.string({ required: true }),
      toTime: t.string({ required: true }),
      gender: t.string({ required: false }),
    }),
  });
