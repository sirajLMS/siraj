import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  PayrollOverrideInputPothos,
  PayrollOverrideResultPothosObject,
} from "@/backend/graphql/pothos/teachers/payroll.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { PayrollCalculationService } from "@/backend/services";

gqlSchemaBuilder.mutationField("applyPayrollOverride", t =>
  t.field({
    type: PayrollOverrideResultPothosObject,
    description:
      "Apply an operator override (Refund / Calculated / Not Calculated / Partially) to a class instance's payroll calculation. The acting operator is resolved from the authenticated context and is never accepted as input.",
    authScopes: { permission: AppPermission.ACCOUNTING_PAYROLL_MANAGE, notImpersonating: true },
    args: {
      input: t.arg({ type: PayrollOverrideInputPothos, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return PayrollCalculationService.applyOverride(
        {
          ...args.input,
          // A null force flag is normalized to absent so the service input
          // never carries a null boolean.
          force: args.input.force ?? undefined,
          actorUserId,
        },
        tErrors
      );
    },
  })
);
