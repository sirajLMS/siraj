import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  CreditAdjustmentInputPothosRef,
  CreditAdjustmentResultPothosObject,
} from "@/backend/graphql/pothos/billing/credit-adjustment.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { CreditService } from "@/backend/services";

gqlSchemaBuilder.mutationField("recordCreditAdjustment", t =>
  t.field({
    type: CreditAdjustmentResultPothosObject,
    description: "Record a manual credit adjustment (Add / Subtract / Subtract With Carryover) for a student",
    authScopes: { permission: AppPermission.ACCOUNTING_CREDITS_MANAGE },
    args: {
      input: t.arg({ type: CreditAdjustmentInputPothosRef, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return CreditService.recordAdjustment(actorUserId, args.input, tErrors);
    },
  })
);
