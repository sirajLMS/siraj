import type { ObjectFieldBuilder } from "@pothos/core";
import type { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CreditAdjustmentTypePothosEnum, CreditReasonPothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import type { CreditTransactionReturnType } from "@/backend/types";

type BuilderTypes = typeof gqlSchemaBuilder extends { $inferSchemaTypes: infer T } ? T : never;
type PothosObjectFieldBuilder = ObjectFieldBuilder<BuilderTypes, CreditTransactionReturnType>;

/**
 * Shared field definitions for credit transaction Pothos objects.
 * Used by CreditTransactionPothosObject, CreditPurchaseResultPothosObject, and
 * CreditAdjustmentResultPothosObject.
 */
export function creditTransactionFields(t: PothosObjectFieldBuilder) {
  return {
    id: t.exposeString("id"),
    studentId: t.exposeString("studentId"),
    changeAmount: t.exposeInt("changeAmount"),
    // Hour-ledger amount for hour-based rows (XOR with changeAmount).
    // numeric(12,2) surfaces as a string at the driver boundary — consumers parse.
    changeAmountHours: t.exposeString("changeAmountHours", { nullable: true }),
    reason: t.expose("reason", { type: CreditReasonPothosEnum }),
    adjustmentType: t.expose("adjustmentType", { type: CreditAdjustmentTypePothosEnum }),
    carryoverTeacherId: t.exposeString("carryoverTeacherId", { nullable: true }),
    carryoverFromDate: t.exposeString("carryoverFromDate", { nullable: true }),
    carryoverToDate: t.exposeString("carryoverToDate", { nullable: true }),
    carryoverPaymentDate: t.exposeString("carryoverPaymentDate", { nullable: true }),
    sourcePaymentId: t.exposeString("sourcePaymentId", { nullable: true }),
    classInstanceId: t.exposeString("classInstanceId", { nullable: true }),
    notes: t.exposeString("notes", { nullable: true }),
    internalNotes: t.exposeString("internalNotes", { nullable: true }),
    creditedByUserId: t.exposeString("creditedByUserId"),
    idempotencyKey: t.exposeString("idempotencyKey"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  };
}
