import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

export type RecurringClassDayInputDefinition = {
  dayOfWeek: string;
  startTime: string;
  isActive: boolean;
};

export const RecurringClassDayInputPothosObject = gqlSchemaBuilder
  .inputRef<RecurringClassDayInputDefinition>("RecurringClassDayInput")
  .implement({
    fields: t => ({
      dayOfWeek: t.string({ required: true }),
      startTime: t.string({ required: true }),
      isActive: t.boolean({ required: true }),
    }),
  });

export type CreateRecurringClassInputDefinition = {
  studentId: string;
  teacherId: string;
  durationMinutes: number;
  defaultStartTime: string;
  timezone: string;
  timezoneId?: number | null;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  days: RecurringClassDayInputDefinition[];
  classType?: string | null;
  generateInstancesForWeeks?: number | null;
};

export const CreateRecurringClassInputPothosObject = gqlSchemaBuilder
  .inputRef<CreateRecurringClassInputDefinition>("CreateRecurringClassInput")
  .implement({
    fields: t => ({
      studentId: t.string({ required: true }),
      teacherId: t.string({ required: true }),
      durationMinutes: t.int({ required: true }),
      defaultStartTime: t.string({ required: true }),
      timezone: t.string({ required: true }),
      timezoneId: t.int({ required: false }),
      effectiveFrom: t.string({ required: false }),
      effectiveUntil: t.string({ required: false }),
      days: t.field({ type: [RecurringClassDayInputPothosObject], required: true }),
      classType: t.string({ required: false }),
      generateInstancesForWeeks: t.int({ required: false }),
    }),
  });

export type CreateRecurringClassResultDefinition = {
  id: string;
  recurringScheduleId: string;
  classInstanceIds: string[];
  classInstanceCount: number;
};

const CreateRecurringClassResultRef =
  gqlSchemaBuilder.objectRef<CreateRecurringClassResultDefinition>("CreateRecurringClassResult");

export const CreateRecurringClassResultPothosObject = CreateRecurringClassResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    recurringScheduleId: t.exposeString("recurringScheduleId"),
    classInstanceIds: t.exposeStringList("classInstanceIds"),
    classInstanceCount: t.exposeInt("classInstanceCount"),
  }),
});
