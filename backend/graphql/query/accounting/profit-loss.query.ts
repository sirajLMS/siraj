import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { ProfitLossReportPothosObject } from "@/backend/graphql/pothos/accounting";
import { CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ProfitLossService } from "@/backend/services";

const DEFAULT_PAGE_LIMIT = 50;

gqlSchemaBuilder.queryField("profitLossReport", t =>
  t.field({
    type: ProfitLossReportPothosObject,
    description:
      "Read-only profit & loss payload for one accounting month: the three tab pages, the executive summary, and the FX-exclusion warnings, all converted into the selected target currency.",
    authScopes: { permission: AppPermission.ACCOUNTING_PROFITS_VIEW },
    args: {
      month: t.arg.string({
        required: true,
        description: "Accounting month in YYYY-MM format.",
      }),
      currency: t.arg({ type: CurrencyCodePothosObject, required: true }),
      paymentsLimit: t.arg.int({ required: false, defaultValue: DEFAULT_PAGE_LIMIT }),
      paymentsOffset: t.arg.int({ required: false, defaultValue: 0 }),
      expensesLimit: t.arg.int({ required: false, defaultValue: DEFAULT_PAGE_LIMIT }),
      expensesOffset: t.arg.int({ required: false, defaultValue: 0 }),
      incomePaymentsLimit: t.arg.int({ required: false, defaultValue: DEFAULT_PAGE_LIMIT }),
      incomePaymentsOffset: t.arg.int({ required: false, defaultValue: 0 }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const translations = ctx.t();
      return ProfitLossService.getReport(
        actorUserId,
        { month: args.month, currency: args.currency },
        {
          paymentsLimit: args.paymentsLimit ?? DEFAULT_PAGE_LIMIT,
          paymentsOffset: args.paymentsOffset ?? 0,
          expensesLimit: args.expensesLimit ?? DEFAULT_PAGE_LIMIT,
          expensesOffset: args.expensesOffset ?? 0,
          incomePaymentsLimit: args.incomePaymentsLimit ?? DEFAULT_PAGE_LIMIT,
          incomePaymentsOffset: args.incomePaymentsOffset ?? 0,
        },
        translations.errorsTranslations,
        translations.dashboardTranslations.accountingProfitLoss
      );
    },
  })
);
