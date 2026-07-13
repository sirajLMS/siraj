import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CreditReasonPothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import type { CreditBalanceReturnType, CreditTransactionReturnType } from "@/backend/types";

const CreditTransactionRef = gqlSchemaBuilder.objectRef<CreditTransactionReturnType>("CreditTransaction");

export const CreditTransactionPothosObject = CreditTransactionRef.implement({
  description: "A credit ledger transaction for a student (purchase, deduction, refund, or adjustment)",
  fields: t => ({
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
  }),
});

const CreditBalanceRef = gqlSchemaBuilder.objectRef<CreditBalanceReturnType>("CreditBalance");

export const CreditBalancePothosObject = CreditBalanceRef.implement({
  description: "Credit balance summary for a student (total classes purchased and remaining)",
  fields: t => ({
    studentId: t.exposeString("studentId"),
    classesTotal: t.exposeInt("classesTotal"),
    classesRemaining: t.exposeInt("classesRemaining"),
  }),
});

const PurchaseResultRef = gqlSchemaBuilder.objectRef<CreditTransactionReturnType>("CreditPurchaseResult");

export const CreditPurchaseResultPothosObject = PurchaseResultRef.implement({
  description: "Result of recording a credit purchase for a student",
  fields: t => ({
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
  }),
});

export const RecordPurchaseInput = gqlSchemaBuilder
  .inputRef<{ studentId: string; hours: number; notes?: string | null; sourcePaymentId?: string | null }>(
    "RecordPurchaseInput"
  )
  .implement({
    description: "Input for recording a credit purchase for a student",
    fields: t => ({
      studentId: t.string({ required: true }),
      hours: t.int({ required: true }),
      notes: t.string({ required: false }),
      sourcePaymentId: t.id({ required: false }),
    }),
  });
