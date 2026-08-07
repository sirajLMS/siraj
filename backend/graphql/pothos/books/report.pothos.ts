import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  DisplayAmountPothosObject,
  resolveDisplayAmountFields,
} from "@/backend/graphql/pothos/billing/fx-display.pothos";
import { CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { ReportGroupingMode, ReportService } from "@/backend/services/report/report.service";
import type { DisplayAmountReturnType } from "@/backend/types";
import type {
  AttendanceReportPaidAmountReturnType,
  AttendanceReportResult,
  AttendanceReportRowReturnType,
} from "@/backend/types/books/report.types";

export const ReportGroupingModeEnum = gqlSchemaBuilder.enumType(ReportGroupingMode, {
  name: "ReportGroupingMode",
  description: "Determines how the attendance data is aggregated.",
});

export const AttendanceReportFiltersInput = gqlSchemaBuilder.inputType("AttendanceReportFiltersInput", {
  description: "Filters applied to the dynamic attendance query engine.",
  fields: t => ({
    fromDate: t.string({ required: true, description: "ISO Date String representing start bound" }),
    toDate: t.string({ required: true, description: "ISO Date String representing end bound" }),
    teacherId: t.string({ required: false, description: "Optional UUID to filter by a specific teacher" }),
    groupBy: t.field({ type: ReportGroupingModeEnum, required: true }),
  }),
});

const AttendanceReportPaidAmountRef =
  gqlSchemaBuilder.objectRef<AttendanceReportPaidAmountReturnType>("AttendanceReportPaidAmount");

export const AttendanceReportPaidAmountObj = AttendanceReportPaidAmountRef.implement({
  description: "Locked paid amount for a report row in a specific currency.",
  fields: t => ({
    id: t.exposeID("id"),
    amount: t.exposeString("amount"),
    currency: t.expose("currency", { type: CurrencyCodePothosObject }),
    displayAmount: t.field({
      type: DisplayAmountPothosObject,
      nullable: true,
      resolve: parent => (parent as unknown as Record<string, unknown>).displayAmount as DisplayAmountReturnType | null,
    }),
  }),
});

const AttendanceReportRowRef = gqlSchemaBuilder.objectRef<AttendanceReportRowReturnType>("AttendanceReportRow");

export const AttendanceReportRowObj = AttendanceReportRowRef.implement({
  description: "A single row of the aggregated attendance report.",
  fields: t => ({
    id: t.exposeString("groupKey"),
    groupKey: t.exposeString("groupKey"),
    groupLabel: t.exposeString("groupLabel"),
    takenClasses: t.exposeInt("takenClasses"),
    absentClasses: t.exposeInt("absentClasses"),
    leaveClasses: t.exposeInt("leaveClasses"),
    pendingClasses: t.exposeInt("pendingClasses"),
    totalHours: t.exposeFloat("totalHours", { nullable: true }),
    paidAmounts: t.field({
      type: [AttendanceReportPaidAmountObj],
      resolve: parent => parent.paidAmounts,
    }),
    engagementGrowth: t.exposeFloat("engagementGrowth", { nullable: true }),
  }),
});

const AttendanceReportPayloadRef = gqlSchemaBuilder.objectRef<AttendanceReportResult>("AttendanceReportPayload");

export const AttendanceReportPayloadObj = AttendanceReportPayloadRef.implement({
  description: "The full attendance report result including rows and growth metric.",
  fields: t => ({
    rows: t.field({
      type: [AttendanceReportRowObj],
      description: "The aggregated attendance report rows.",
      resolve: parent => parent.rows,
    }),
    engagementGrowth: t.float({
      nullable: true,
      description: "Period-over-period engagement growth percentage, or null if unavailable.",
      resolve: parent => parent.engagementGrowth,
    }),
  }),
});

gqlSchemaBuilder.queryField("generateAttendanceReport", t =>
  t.field({
    type: AttendanceReportPayloadObj,
    authScopes: { superAdmin: true },
    description: "Generates dynamic attendance and financial reports.",
    args: {
      filters: t.arg({ type: AttendanceReportFiltersInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const filters = {
        fromDate: new Date(args.filters.fromDate),
        toDate: new Date(args.filters.toDate),
        teacherId: args.filters.teacherId ?? undefined,
        groupBy: args.filters.groupBy,
      };

      const result = await ReportService.generateAttendanceReport(filters, ctx.user.id, ctx.locale);

      const allPaidAmounts = result.rows.flatMap(row => row.paidAmounts);
      const displayAmounts = await resolveDisplayAmountFields(
        allPaidAmounts as unknown as Record<string, unknown>[],
        ctx,
        "amount",
        "currency"
      );

      return {
        ...result,
        rows: result.rows.map(row => (Object.assign(row, { paidAmounts: row.paidAmounts.map((pa) => ({
	...pa,
	displayAmount: displayAmounts.get(pa.id) ?? null
})) }))),
      };
    },
  })
);
