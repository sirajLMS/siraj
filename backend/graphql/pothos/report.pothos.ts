import type { AttendanceReportRow } from "@/backend/services/report/report.service";
import { ReportGroupingMode, ReportService } from "@/backend/services/report/report.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

// 1. Enum Mapping
export const ReportGroupingModeEnum = gqlSchemaBuilder.enumType(ReportGroupingMode, {
  name: "ReportGroupingMode",
  description: "Determines how the attendance data is aggregated.",
});

// 2. Input Filters
export const AttendanceReportFiltersInput = gqlSchemaBuilder.inputType("AttendanceReportFiltersInput", {
  description: "Filters applied to the dynamic attendance query engine.",
  fields: t => ({
    fromDate: t.string({ required: true, description: "ISO Date String representing start bound" }),
    toDate: t.string({ required: true, description: "ISO Date String representing end bound" }),
    teacherId: t.string({ required: false, description: "Optional UUID to filter by a specific teacher" }),
    groupBy: t.field({ type: ReportGroupingModeEnum, required: true }),
  }),
});

// 3. Output Object
// We use gqlSchemaBuilder.objectRef to define the shape of the ephemeral report row.
const AttendanceReportRowRef = gqlSchemaBuilder.objectRef<AttendanceReportRow>("AttendanceReportRow");

export const AttendanceReportRowObj = AttendanceReportRowRef.implement({
  description: "A single row of the aggregated attendance report.",
  fields: t => ({
    // Caching ID requirement. groupKey is unique per result set.
    id: t.exposeString("groupKey"),

    // Core Identifiers
    groupKey: t.exposeString("groupKey"),
    groupLabel: t.exposeString("groupLabel"),

    // Operational Metrics
    takenClasses: t.exposeInt("takenClasses"),
    absentClasses: t.exposeInt("absentClasses"),
    leaveClasses: t.exposeInt("leaveClasses"),
    pendingClasses: t.exposeInt("pendingClasses"),

    // Financial Metrics (Nullable due to potential permission masking)
    totalHours: t.exposeFloat("totalHours", { nullable: true }),
    paidEGP: t.exposeFloat("paidEGP", { nullable: true }),
    paidUSD: t.exposeFloat("paidUSD", { nullable: true }),
  }),
});

// 4. Query Exposure
gqlSchemaBuilder.queryField("generateAttendanceReport", t =>
  t.field({
    type: [AttendanceReportRowObj],
    description: "Generates dynamic attendance and financial reports.",
    args: {
      filters: t.arg({ type: AttendanceReportFiltersInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      // 1. Authentication Check
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      // 2. Mapping inputs to native Date objects
      const filters = {
        fromDate: new Date(args.filters.fromDate),
        toDate: new Date(args.filters.toDate),
        teacherId: args.filters.teacherId ?? undefined,
        groupBy: args.filters.groupBy,
      };

      // 3. Delegate to Service Layer
      // The Service enforces REPORT_GENERATE_CUSTOM and REPORT_VIEW_FINANCIALS.
      return ReportService.generateAttendanceReport(filters, ctx.user.id, ctx.locale);
    },
  })
);
