import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  PayrollReportFilterPothosInput,
  PayrollReportPagePothosObject,
} from "@/backend/graphql/pothos/teachers/payroll.pothos";
import { reportPageWindow, reportPaginationArgs, reportResolverContext } from "@/backend/graphql/query/__shared__";
import { PayrollCalculationService } from "@/backend/services";

gqlSchemaBuilder.queryField("payrollReport", t =>
  t.field({
    type: PayrollReportPagePothosObject,
    description:
      "Paginated payroll report across class instances. Aggregates cover the full filtered set (capped at 10,000 rows), not just the returned page.",
    authScopes: { permission: AppPermission.ACCOUNTING_PAYROLL_VIEW },
    args: {
      filter: t.arg({ type: PayrollReportFilterPothosInput, required: false }),
      ...reportPaginationArgs(t),
    },
    resolve: async (_root, args, ctx) => {
      const { actorUserId, tErrors } = await reportResolverContext(ctx);
      return PayrollCalculationService.getReport(actorUserId, args.filter ?? {}, reportPageWindow(args), tErrors);
    },
  })
);
