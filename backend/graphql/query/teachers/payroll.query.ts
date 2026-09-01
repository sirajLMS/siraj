import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  PayrollReportFilterPothosInput,
  PayrollReportPagePothosObject,
} from "@/backend/graphql/pothos/teachers/payroll.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { PayrollCalculationService } from "@/backend/services";

gqlSchemaBuilder.queryField("payrollReport", t =>
  t.field({
    type: PayrollReportPagePothosObject,
    description:
      "Paginated payroll report across class instances. Aggregates cover the full filtered set (capped at 10,000 rows), not just the returned page.",
    authScopes: { permission: AppPermission.ACCOUNTING_PAYROLL_VIEW },
    args: {
      filter: t.arg({ type: PayrollReportFilterPothosInput, required: false }),
      limit: t.arg.int({
        required: false,
        defaultValue: 50,
        description: "Max rows per page (max 200)",
        directives: { constraint: { min: 1, max: 200 } },
      }),
      offset: t.arg.int({ required: false, defaultValue: 0 }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return PayrollCalculationService.getReport(
        actorUserId,
        args.filter ?? {},
        { limit: args.limit ?? 50, offset: args.offset ?? 0 },
        tErrors
      );
    },
  })
);
