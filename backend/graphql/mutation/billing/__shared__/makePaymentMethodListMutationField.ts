import type { ObjectRef } from "@pothos/core";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";

type BuilderTypes = typeof gqlSchemaBuilder extends { $inferSchemaTypes: infer T } ? T : never;
type ErrorsTranslations = ReturnType<BaseContext["t"]>["errorsTranslations"];

interface PaymentMethodIdMutationOptions {
  fieldName: string;
  returnType: ObjectRef<BuilderTypes, unknown>;
  description: string;
  getService: (actorUserId: string, id: string, tErrors: ErrorsTranslations) => Promise<unknown>;
}

/**
 * Factory that registers a payment-method mutation field on the schema
 * builder for mutations that take a single `id` arg and return a
 * `UserPaymentMethodPothosObject`.
 *
 * Used by `setDefaultUserPaymentMethod` and `verifyBankTransferPaymentMethod`
 * to eliminate the duplicated args/auth/resolve boilerplate (Pair 10).
 *
 * Both mutations share:
 * - type: `UserPaymentMethodPothosObject`
 * - args: `{ id: ID! }`
 * - authScopes: `{ loggedIn: true }`
 * - resolve prelude: `requireAuth(ctx)` → `ctx.t().errorsTranslations` → service call
 */
export function makePaymentMethodIdMutationField(opts: PaymentMethodIdMutationOptions): void {
  gqlSchemaBuilder.mutationField(opts.fieldName, t =>
    t.field({
      type: opts.returnType,
      authScopes: { loggedIn: true },
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: async (_root, args, ctx) => {
        const actorUserId = await requireAuth(ctx);
        const tErrors = ctx.t().errorsTranslations;
        return opts.getService(actorUserId, args.id, tErrors);
      },
    })
  );
}
