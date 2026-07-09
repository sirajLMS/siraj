import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { IanaTimezonePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import type {
  CreateRecurringClassInput,
  CreateRecurringClassReturnType,
  RecurringClassDayInput,
} from "@/backend/types";

export const RecurringClassDayInputPothosObject = gqlSchemaBuilder
  .inputRef<RecurringClassDayInput>("RecurringClassDayInput")
  .implement({
    fields: t => ({
      dayOfWeek: t.string({ required: true, directives: { constraint: { maxLength: 20 } } }),
      startTime: t.string({ required: true, directives: { constraint: { maxLength: 10 } } }),
      isActive: t.boolean({ required: true }),
    }),
  });

export const CreateRecurringClassInputPothosObject = gqlSchemaBuilder
  .inputRef<CreateRecurringClassInput>("CreateRecurringClassInput")
  .implement({
    fields: t => ({
      studentId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      teacherId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      durationMinutes: t.int({ required: true }),
      defaultStartTime: t.string({ required: true, directives: { constraint: { maxLength: 10 } } }),
      timezone: t.field({ type: IanaTimezonePothosObject, required: true }),
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

const CreateRecurringClassResultRef =
  gqlSchemaBuilder.objectRef<CreateRecurringClassReturnType>("CreateRecurringClassResult");

export const CreateRecurringClassResultPothosObject = CreateRecurringClassResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    recurringScheduleId: t.exposeString("recurringScheduleId"),
    classInstanceIds: t.exposeStringList("classInstanceIds"),
    classInstanceCount: t.exposeInt("classInstanceCount"),
  }),
});
