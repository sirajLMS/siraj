import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  ClassTypePothosObject,
  CurrencyCodePothosObject,
  DayOfWeekPothosObject,
  OnDemandNoCreditsOutcomePothosEnum,
  SchedulingModePothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import type {
  CreateRecurringClassInput,
  CreateRecurringClassReturnType,
  RecurringClassDayInput,
} from "@/backend/types";

export const RecurringClassDayInputPothosObject = gqlSchemaBuilder
  .inputRef<RecurringClassDayInput>("RecurringClassDayInput")
  .implement({
    fields: t => ({
      dayOfWeek: t.field({ type: DayOfWeekPothosObject, required: true }),
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
      subjectId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      durationMinutes: t.int({ required: true, directives: { constraint: { min: 1, max: 1440 } } }),
      defaultStartTime: t.string({ required: true, directives: { constraint: { maxLength: 10 } } }),
      timezone: t.field({ type: "IanaTimezone", required: true }),
      effectiveFrom: t.string({ required: false, directives: { constraint: { maxLength: 20 } } }),
      effectiveUntil: t.string({ required: false, directives: { constraint: { maxLength: 20 } } }),
      days: t.field({
        type: [RecurringClassDayInputPothosObject],
        required: true,
        directives: { constraint: { maxItems: 7 } },
      }),
      classType: t.field({ type: ClassTypePothosObject, required: false }),
      generateInstancesForWeeks: t.int({ required: false, directives: { constraint: { min: 1, max: 104 } } }),
      hourlyRate: t.string({ required: false, directives: { constraint: { maxLength: 20 } } }),
      rateCurrency: t.field({ type: CurrencyCodePothosObject, required: false }),
      quotaId: t.string({ required: false, directives: { constraint: { maxLength: 36 } } }),
      earmarkedClasses: t.int({ required: false, directives: { constraint: { min: 0, max: 10000 } } }),
      schedulingMode: t.field({ type: SchedulingModePothosEnum, required: false }),
      generationHorizonWeeks: t.int({ required: false, directives: { constraint: { min: 1, max: 104 } } }),
      ondemandNoCreditsOutcome: t.field({ type: OnDemandNoCreditsOutcomePothosEnum, required: false }),
    }),
  });

export const CreateRecurringClassResultRef =
  gqlSchemaBuilder.objectRef<CreateRecurringClassReturnType>("CreateRecurringClassResult");

export const CreateRecurringClassResultPothosObject = CreateRecurringClassResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    recurringScheduleId: t.exposeString("recurringScheduleId"),
    classInstanceIds: t.exposeStringList("classInstanceIds"),
    classInstanceCount: t.exposeInt("classInstanceCount"),
    meetingUrl: t.exposeString("meetingUrl", { nullable: true }),
  }),
});
