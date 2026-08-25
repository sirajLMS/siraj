import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  recurringScheduleDetailFields,
  recurringScheduleListItemFields,
} from "@/backend/graphql/pothos/scheduling/__shared__/recurringScheduleSharedFields";
import { CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { PageInfoObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import type {
  RecurringScheduleDayDetailReturnType,
  RecurringScheduleDetailReturnType,
  RecurringScheduleListItem,
  RecurringSchedulesPaginatedResult,
} from "@/backend/types";

export const RecurringScheduleDayDetailRef =
  gqlSchemaBuilder.objectRef<RecurringScheduleDayDetailReturnType>("RecurringScheduleDayDetail");

export const RecurringScheduleDayDetailPothosObject = RecurringScheduleDayDetailRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    dayOfWeek: t.exposeString("dayOfWeek"),
    startTime: t.exposeString("startTime"),
    isActive: t.exposeBoolean("isActive"),
  }),
});

export const RecurringScheduleDetailRef =
  gqlSchemaBuilder.objectRef<RecurringScheduleDetailReturnType>("RecurringScheduleDetail");

export const RecurringScheduleDetailPothosObject = RecurringScheduleDetailRef.implement({
  fields: t => ({
    ...recurringScheduleDetailFields(t, RecurringScheduleDayDetailPothosObject),
  }),
});

export const RecurringScheduleListItemRef =
  gqlSchemaBuilder.objectRef<RecurringScheduleListItem>("RecurringScheduleListItem");

export const RecurringScheduleListItemPothosObject = RecurringScheduleListItemRef.implement({
  fields: t => ({
    ...recurringScheduleListItemFields(t),
  }),
});

export const RecurringSchedulesPaginatedResultRef = gqlSchemaBuilder.objectRef<RecurringSchedulesPaginatedResult>(
  "RecurringSchedulesPaginatedResult"
);

export const RecurringSchedulesPaginatedResultPothosObject = RecurringSchedulesPaginatedResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [RecurringScheduleListItemRef] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

export const UpdateRecurringClassRateInputPothos = gqlSchemaBuilder.inputType("UpdateRecurringClassRateInput", {
  fields: t => ({
    recurringScheduleId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    hourlyRate: t.string({ required: false, directives: { constraint: { maxLength: 20 } } }),
    rateCurrency: t.field({ type: CurrencyCodePothosObject, required: false }),
  }),
});

// ─── Recurring Schedules Query ──────────────────────────────────────────────────
