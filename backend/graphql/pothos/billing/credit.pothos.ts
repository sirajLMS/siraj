import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { creditTransactionFields } from "@/backend/graphql/pothos/billing/__shared__/creditFieldHelpers";
import type {
  CreditBalanceReturnType,
  CreditTransactionReturnType,
  CreditTransactionSubmitInput,
} from "@/backend/types";

const CreditTransactionRef = gqlSchemaBuilder.objectRef<CreditTransactionReturnType>("CreditTransaction");

export const CreditTransactionPothosObject = CreditTransactionRef.implement({
  description: "A credit ledger transaction for a student (purchase, deduction, refund, or adjustment)",
  fields: t => creditTransactionFields(t),
});

const CreditBalanceRef = gqlSchemaBuilder.objectRef<CreditBalanceReturnType>("CreditBalance");

export const CreditBalancePothosObject = CreditBalanceRef.implement({
  description: "Credit balance summary for a student (total classes purchased and remaining)",
  fields: t => ({
    id: t.string({ resolve: parent => parent.studentId }),
    studentId: t.exposeString("studentId"),
    classesTotal: t.exposeInt("classesTotal"),
    classesRemaining: t.exposeInt("classesRemaining"),
  }),
});

const PurchaseResultRef = gqlSchemaBuilder.objectRef<CreditTransactionReturnType>("CreditPurchaseResult");

export const CreditPurchaseResultPothosObject = PurchaseResultRef.implement({
  description: "Result of recording a credit purchase for a student",
  fields: t => creditTransactionFields(t),
});

export const RecordPurchaseInput = gqlSchemaBuilder
  .inputRef<CreditTransactionSubmitInput>("RecordPurchaseInput")
  .implement({
    description: "Input for recording a credit purchase for a student",
    fields: t => ({
      studentId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      hours: t.int({ required: true, directives: { constraint: { min: 0, max: 100000 } } }),
      notes: t.string({ required: false, directives: { constraint: { maxLength: 2000 } } }),
      sourcePaymentId: t.id({ required: false }),
    }),
  });
