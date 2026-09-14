import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
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
