import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  recurringScheduleDetailFields,
  recurringScheduleListItemFields,
} from "@/backend/graphql/pothos/scheduling/__shared__/recurringScheduleSharedFields";
import { CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { PageInfoObject, PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import type {
  RecurringScheduleDayDetailReturnType,
  RecurringScheduleDetailReturnType,
  RecurringScheduleListItem,
  RecurringSchedulesPaginatedResult,
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
    ...recurringScheduleDetailFields(t, RecurringScheduleDayDetailPothosObject),
  }),
});

const RecurringScheduleListItemRef = gqlSchemaBuilder.objectRef<RecurringScheduleListItem>("RecurringScheduleListItem");

export const RecurringScheduleListItemPothosObject = RecurringScheduleListItemRef.implement({
  fields: t => ({
    ...recurringScheduleListItemFields(t),
  }),
});

const RecurringSchedulesPaginatedResultRef = gqlSchemaBuilder.objectRef<RecurringSchedulesPaginatedResult>(
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
    recurringScheduleId: t.string({ required: true }),
    hourlyRate: t.string({ required: false }),
    rateCurrency: t.field({ type: CurrencyCodePothosObject, required: false }),
  }),
});

// ─── Recurring Schedules Query ──────────────────────────────────────────────────

gqlSchemaBuilder.queryField("recurringSchedules", t =>
  t.field({
    type: RecurringSchedulesPaginatedResultRef,
    args: {
      pagination: t.arg({ type: PaginationArgsObject, required: false }),
      search: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      const userId = ctx.user?.id ?? "";

      const { RecurringScheduleDetailService } = await import(
        "@/backend/services/schedule/recurring-schedule-detail.service"
      );

      const page = args.pagination?.page ?? 1;
      const pageSize = args.pagination?.first ?? 20;

      const result = await RecurringScheduleDetailService.listAll(userId, tErrors, {
        page,
        pageSize,
        search: args.search ?? undefined,
      });

      return {
        id: "recurring-schedules-list",
        rows: result.rows.map(row => ({
          id: row.id,
          studentId: row.studentId,
          studentName: row.studentName,
          teacherId: row.teacherId,
          teacherName: row.teacherUserName,
          durationMinutes: row.durationMinutes,
          defaultStartTime: row.defaultStartTime.slice(0, 5),
          timezone: row.timezone,
          hourlyRate: row.hourlyRate,
          rateCurrency: row.rateCurrency,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        })),
        totalCount: result.totalCount,
        pageInfo: {
          count: result.rows.length,
          currentPage: page,
          firstItem: result.totalCount > 0 ? (page - 1) * pageSize + 1 : null,
          hasMorePages: page * pageSize < result.totalCount,
          lastItem: result.totalCount > 0 ? Math.min(page * pageSize, result.totalCount) : null,
          lastPage: Math.ceil(result.totalCount / pageSize),
          perPage: pageSize,
          total: result.totalCount,
        },
      };
    },
  })
);
