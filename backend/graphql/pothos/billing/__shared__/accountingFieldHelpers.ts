import type { ObjectFieldBuilder } from "@pothos/core";
import type { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { PaymentGatewayPothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import type {
  AccountingPaymentReturnType,
  PackagePlanReturnType,
} from "@/backend/types";

type BuilderTypes = typeof gqlSchemaBuilder extends { $inferSchemaTypes: infer T } ? T : never;
type PackagePlanFieldBuilder = ObjectFieldBuilder<BuilderTypes, PackagePlanReturnType>;
type AccountingPaymentFieldBuilder = ObjectFieldBuilder<BuilderTypes, AccountingPaymentReturnType>;

/** Shared field map for the PackagePlan object (catalog views). */
export function packagePlanFields(t: PackagePlanFieldBuilder) {
  return {
    id: t.exposeString("id"),
    codename: t.exposeString("codename"),
    displayName: t.exposeString("displayName"),
    description: t.exposeString("description", { nullable: true }),
    creditHours: t.string({ resolve: parent => String(parent.creditHours) }),
    priceAmount: t.string({ resolve: parent => String(parent.priceAmount) }),
    currency: t.exposeString("currency"),
    active: t.exposeBoolean("active"),
    sortOrder: t.exposeInt("sortOrder"),
    version: t.exposeInt("version"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  };
}

/** Shared field map for the AccountingPayment object (list/detail views). */
export function accountingPaymentFields(t: AccountingPaymentFieldBuilder) {
  return {
    id: t.exposeString("id"),
    invoiceId: t.exposeString("invoiceId"),
    amount: t.exposeString("amount"),
    currency: t.exposeString("currency"),
    paymentDate: t.expose("paymentDate", { type: "DateTime" }),
    packagePlanId: t.exposeString("packagePlanId", { nullable: true }),
    packageCodename: t.exposeString("packageCodename", { nullable: true }),
    packageName: t.exposeString("packageName", { nullable: true }),
    paymentGateway: t.expose("paymentGateway", { type: PaymentGatewayPothosObject }),
    creditHours: t.exposeString("creditHours", { nullable: true }),
    isPaidStatusOn: t.exposeBoolean("isPaidStatusOn"),
    paymentNote: t.exposeString("paymentNote", { nullable: true }),
    studentId: t.exposeString("studentId", { nullable: true }),
    studentName: t.exposeString("studentName", { nullable: true }),
    parentId: t.exposeString("parentId", { nullable: true }),
    parentName: t.exposeString("parentName", { nullable: true }),
    invoiceStatus: t.exposeString("invoiceStatus"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  };
}
