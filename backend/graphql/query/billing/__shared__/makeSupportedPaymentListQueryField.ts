import type { RootFieldBuilder } from "@pothos/core";
import type { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import type { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { PaymentDirectionPothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";

type BuilderTypes = typeof gqlSchemaBuilder extends { $inferSchemaTypes: infer T } ? T : never;
type QueryFieldBuilder = RootFieldBuilder<BuilderTypes, unknown, "Query">;
type ErrorsTranslations = ReturnType<BaseContext["t"]>["errorsTranslations"];

export interface SupportedListFilters {
  direction?: PaymentDirection;
  activeOnly?: boolean;
}

export function supportedListArgs(t: QueryFieldBuilder) {
  return {
    direction: t.arg({ type: PaymentDirectionPothosEnum, required: false }),
    activeOnly: t.arg.boolean({ required: false, defaultValue: true }),
  };
}

export function supportedListResolve<TItem>(
  listFn: (actorUserId: string, tErrors: ErrorsTranslations, filters: SupportedListFilters) => Promise<TItem[]>
) {
  return async (
    _parent: unknown,
    args: { direction?: PaymentDirection | null; activeOnly?: boolean | null },
    ctx: BaseContext
  ): Promise<TItem[]> => {
    const actorUserId = await requireAuth(ctx);
    const tErrors = ctx.t().errorsTranslations;
    const filters: SupportedListFilters = {
      direction: args.direction ?? undefined,
      activeOnly: args.activeOnly ?? true,
    };
    return listFn(actorUserId, tErrors, filters);
  };
}
