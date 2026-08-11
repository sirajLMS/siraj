import type { ObjectFieldBuilder } from "@pothos/core";
import type { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CreditReasonPothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import type { CreditTransactionReturnType } from "@/backend/types";

type BuilderTypes = typeof gqlSchemaBuilder extends { $inferSchemaTypes: infer T } ? T : never;
type PothosObjectFieldBuilder = ObjectFieldBuilder<BuilderTypes, CreditTransactionReturnType>;

/**
 * Shared field definitions for credit transaction Pothos objects.
 * Used by CreditTransactionPothosObject and CreditPurchaseResultPothosObject.
 */
export function creditTransactionFields(t: PothosObjectFieldBuilder) {
  return {
    id: t.exposeString("id"),
    studentId: t.exposeString("studentId"),
    changeAmount: t.exposeInt("changeAmount"),
    reason: t.expose("reason", { type: CreditReasonPothosEnum }),
    sourcePaymentId: t.exposeString("sourcePaymentId", { nullable: true }),
    classInstanceId: t.exposeString("classInstanceId", { nullable: true }),
    notes: t.exposeString("notes", { nullable: true }),
    creditedByUserId: t.exposeString("creditedByUserId"),
    idempotencyKey: t.exposeString("idempotencyKey"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  };
}
