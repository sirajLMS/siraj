import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { DisplayAmountPothosObject } from "@/backend/graphql/pothos/billing/fx-display.pothos";
import { CurrencyCodePothosObject, ReportGroupingModeEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import type {
  AttendanceReportPaidAmountReturnType,
  AttendanceReportResult,
  AttendanceReportRowReturnType,
} from "@/backend/types";

export const AttendanceReportFiltersInput = gqlSchemaBuilder.inputType("AttendanceReportFiltersInput", {
  description: "Filters applied to the dynamic attendance query engine.",
  fields: t => ({
    fromDate: t.string({
      required: true,
      description: "ISO Date String representing start bound",
      directives: { constraint: { maxLength: 30 } },
    }),
    toDate: t.string({
      required: true,
      description: "ISO Date String representing end bound",
      directives: { constraint: { maxLength: 30 } },
    }),
    teacherId: t.string({
      required: false,
      description: "Optional UUID to filter by a specific teacher",
      directives: { constraint: { maxLength: 36 } },
    }),
    groupBy: t.field({ type: ReportGroupingModeEnum, required: true }),
  }),
});

export const AttendanceReportPaidAmountRef =
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
      resolve: parent => parent.displayAmount ?? null,
    }),
  }),
});

export const AttendanceReportRowRef = gqlSchemaBuilder.objectRef<AttendanceReportRowReturnType>("AttendanceReportRow");

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

export const AttendanceReportPayloadRef = gqlSchemaBuilder.objectRef<AttendanceReportResult>("AttendanceReportPayload");

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
