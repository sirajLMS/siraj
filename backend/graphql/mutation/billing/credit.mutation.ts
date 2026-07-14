import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CreditPurchaseResultPothosObject } from "@/backend/graphql/pothos/billing/credit.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { PermissionsService } from "@/backend/services";
import { CreditService } from "@/backend/services/billing/credit.service";

gqlSchemaBuilder.mutationField("recordCreditPurchase", t =>
  t.field({
    type: CreditPurchaseResultPothosObject,
    description: "Record a credit purchase for a student (adds classes to their balance)",
    authScopes: { loggedIn: true },
    args: {
      studentId: t.arg.id({ required: true }),
      hours: t.arg.int({ required: true }),
      notes: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.CREDITS_MANAGE);
      if (!hasPermission) {
        const tErrors = await ctx.t("errors");
        throw new Error(tErrors.insufficientPermissions);
      }

      return CreditService.recordPurchase(
        actorUserId,
        {
          studentId: args.studentId,
          hours: args.hours,
          notes: args.notes ?? undefined,
        },
        ctx.locale
      );
    },
  })
);
