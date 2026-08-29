import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { creditTransactionFields } from "@/backend/graphql/pothos/billing/__shared__/creditFieldHelpers";
import { CreditAdjustmentTypePothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import type { CreditAdjustmentInput, CreditAdjustmentReturnType } from "@/backend/types";

export const CreditAdjustmentInputPothosRef = gqlSchemaBuilder
  .inputRef<CreditAdjustmentInput>("CreditAdjustmentInput")
  .implement({
    description:
      "Input for recording a manual credit adjustment. Carryover fields are required only when adjustmentType is SUBTRACT_WITH_CARRYOVER.",
    fields: t => ({
      studentId: t.id({ required: true }),
      adjustmentType: t.field({ type: CreditAdjustmentTypePothosEnum, required: true }),
      hours: t.int({ required: true, directives: { constraint: { min: 1, max: 100000 } } }),
      notes: t.string({ required: false, directives: { constraint: { maxLength: 2000 } } }),
      carryoverTeacherId: t.id({ required: false }),
      carryoverFromDate: t.string({ required: false }),
      carryoverToDate: t.string({ required: false }),
      carryoverPaymentDate: t.string({ required: false }),
    }),
  });

export const CreditAdjustmentResultRef =
  gqlSchemaBuilder.objectRef<CreditAdjustmentReturnType>("CreditAdjustmentResult");

export const CreditAdjustmentResultPothosObject = CreditAdjustmentResultRef.implement({
  description: "A recorded credit adjustment ledger row, carrying the adjustment type and carryover metadata",
  fields: t => creditTransactionFields(t),
});
