import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { FxDisplayService } from "@/backend/services/billing/fx-display.service";
import { parseCurrencyCode } from "@/backend/lib/enum";
import type { DisplayAmountReturnType } from "@/backend/types";

const DisplayAmountRef = gqlSchemaBuilder.objectRef<DisplayAmountReturnType>("DisplayAmount");

export const DisplayAmountPothosObject = DisplayAmountRef.implement({
  fields: t => ({
    id: t.exposeID("id"),
    amount: t.exposeString("amount", { nullable: true }),
    currency: t.expose("currency", { type: CurrencyCodePothosObject }),
    stale: t.boolean({ resolve: parent => parent.stale }),
  }),
});

export function resolveDisplayAmountField<P extends { id: string }>(
  parent: P,
  ctx: BaseContext,
  amountKey: keyof P & string = "amount" as keyof P & string,
  currencyKey: keyof P & string = "currency" as keyof P & string
) {
  const displayCurrency = ctx.user?.displayCurrency ?? null;
  if (!displayCurrency) {
    return null;
  }

  return FxDisplayService.convertForDisplay(
    parent[amountKey] as string | null | undefined,
    parseCurrencyCode(parent[currencyKey] as string | null | undefined),
    displayCurrency,
    parent.id,
    undefined,
    ctx.locale
  );
}
