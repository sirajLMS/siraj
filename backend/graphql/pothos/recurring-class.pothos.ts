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
      dayOfWeek: t.string({ required: true, directives: { constraint: { maxLength: 20 } } }),
      startTime: t.string({ required: true, directives: { constraint: { maxLength: 10 } } }),
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
      studentId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      teacherId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      durationMinutes: t.int({ required: true }),
      defaultStartTime: t.string({ required: true, directives: { constraint: { maxLength: 10 } } }),
      timezone: t.string({ required: true, directives: { constraint: { maxLength: 255 } } }),
      timezoneId: t.int({ required: false }),
      effectiveFrom: t.string({ required: false, directives: { constraint: { maxLength: 20 } } }),
      effectiveUntil: t.string({ required: false, directives: { constraint: { maxLength: 20 } } }),
      days: t.field({
        type: [RecurringClassDayInputPothosObject],
        required: true,
        directives: { constraint: { maxItems: 7 } },
      }),
      classType: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
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
