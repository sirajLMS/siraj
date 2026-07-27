import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CurrencyCodePothosObject, IanaTimezonePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import type {
  RecurringScheduleDayDetailReturnType,
  RecurringScheduleDetailReturnType,
} from "@/backend/types/scheduling/recurring-schedule-detail.types";

const RecurringScheduleDayDetailRef =
  gqlSchemaBuilder.objectRef<RecurringScheduleDayDetailReturnType>("RecurringScheduleDayDetail");

export const RecurringScheduleDayDetailPothosObject = RecurringScheduleDayDetailRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    dayOfWeek: t.exposeString("dayOfWeek"),
    startTime: t.exposeString("startTime"),
    isActive: t.exposeBoolean("isActive"),
  }),
});

const RecurringScheduleDetailRef =
  gqlSchemaBuilder.objectRef<RecurringScheduleDetailReturnType>("RecurringScheduleDetail");

export const RecurringScheduleDetailPothosObject = RecurringScheduleDetailRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    studentId: t.exposeString("studentId"),
    studentName: t.exposeString("studentName"),
    teacherId: t.exposeString("teacherId"),
    teacherName: t.exposeString("teacherName"),
    durationMinutes: t.exposeInt("durationMinutes"),
    defaultStartTime: t.exposeString("defaultStartTime"),
    timezone: t.expose("timezone", { type: IanaTimezonePothosObject }),
    days: t.expose("days", { type: [RecurringScheduleDayDetailPothosObject] }),
    hourlyRate: t.exposeString("hourlyRate", { nullable: true }),
    rateCurrency: t.expose("rateCurrency", { type: CurrencyCodePothosObject, nullable: true }),
  }),
});

export const UpdateRecurringClassRateInputPothos = gqlSchemaBuilder.inputType("UpdateRecurringClassRateInput", {
  fields: t => ({
    recurringScheduleId: t.string({ required: true }),
    hourlyRate: t.string({ required: false }),
    rateCurrency: t.field({ type: CurrencyCodePothosObject, required: false }),
  }),
});
