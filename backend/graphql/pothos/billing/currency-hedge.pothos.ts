import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import type { CurrencyHedgeSelectType } from "@/backend/types";

export const CurrencyHedgeRef = gqlSchemaBuilder.objectRef<CurrencyHedgeSelectType>("CurrencyHedge");

export const CurrencyHedgePothosObject = CurrencyHedgeRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    currency: t.expose("currency", { type: CurrencyCodePothosObject }),
    amount: t.exposeString("amount"),
    hedgeType: t.exposeString("hedgeType"),
    notes: t.exposeString("notes", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});
