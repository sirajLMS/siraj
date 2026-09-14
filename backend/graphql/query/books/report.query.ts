// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { GraphQLError } from "graphql";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { AttendanceReportFiltersInput, AttendanceReportPayloadObj } from "@/backend/graphql/pothos/books/report.pothos";
import { ReportService, resolveDisplayAmountFields } from "@/backend/services";

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
        const tErrors = ctx.t().errorsTranslations;
        throw new GraphQLError(tErrors.unauthorized, { extensions: { code: "UNAUTHENTICATED" } });
      }

      const filters = {
        fromDate: new Date(args.filters.fromDate),
        toDate: new Date(args.filters.toDate),
        teacherId: args.filters.teacherId ?? undefined,
        groupBy: args.filters.groupBy,
      };

      const result = await ReportService.generateAttendanceReport(filters, ctx.user.id, ctx.locale);

      const allPaidAmounts = result.rows.flatMap(row => row.paidAmounts);
      const displayAmounts = await resolveDisplayAmountFields(allPaidAmounts, ctx, "amount", "currency");

      return {
        ...result,
        rows: result.rows.map(row =>
          Object.assign(row, {
            paidAmounts: row.paidAmounts.map(pa => ({
              ...pa,
              displayAmount: displayAmounts.get(pa.id) ?? null,
            })),
          })
        ),
      };
    },
  })
);
