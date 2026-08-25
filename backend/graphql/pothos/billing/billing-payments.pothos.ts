import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { paymentFields } from "@/backend/graphql/pothos/billing/__shared__/paymentFieldHelpers";
import type { PaymentReturnType, TeacherPaymentReturnType } from "@/backend/types";

export const PaymentRef = gqlSchemaBuilder.objectRef<PaymentReturnType>("Payment");

export const PaymentPothosObject = PaymentRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    invoiceId: t.exposeString("invoiceId"),
    transactionId: t.exposeString("transactionId", { nullable: true }),
    ...paymentFields(t),
  }),
});

export const TeacherPaymentRef = gqlSchemaBuilder.objectRef<TeacherPaymentReturnType>("TeacherPayment");

export const TeacherPaymentPothosObject = TeacherPaymentRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    teacherId: t.exposeString("teacherId"),
    isTestPayment: t.exposeBoolean("isTestPayment"),
    ...paymentFields(t),
  }),
});
