import { AppPermission } from "@/backend/enum";
import { PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  DisplayAmountPothosObject,
  resolveDisplayAmountField,
} from "@/backend/graphql/pothos/billing/fx-display.pothos";
import { PaymentMethodTransactionSnapshotPothosObject } from "@/backend/graphql/pothos/billing/payment-method.pothos";
import { CurrencyCodePothosObject, PaymentMethodTypePothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import { PermissionsService } from "@/backend/services";
import { buildMaskedTransactionSnapshot } from "@/backend/services/payment-method/payment-method-mask";
import type { PaymentSelectType } from "@/backend/types/billing/billing.types";
import type { PaymentMethodTransactionSnapshot } from "@/backend/types/billing/payment-method.types";
import type { TeacherPaymentSelectType } from "@/backend/types/teachers/teacher.types";

async function shouldRevealPaymentSnapshot(ctx: BaseContext): Promise<boolean> {
  if (!ctx.user?.id) return false;
  return PermissionsService.hasPermission(ctx.user.id, AppPermission.BILLING_UPDATE_STATUS_PAID);
}

const PaymentRef = gqlSchemaBuilder.objectRef<PaymentSelectType>("Payment");

export const PaymentPothosObject = PaymentRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    invoiceId: t.exposeString("invoiceId"),
    amount: t.exposeString("amount"),
    currency: t.expose("currency", { type: CurrencyCodePothosObject }),
    displayAmount: t.field({
      type: DisplayAmountPothosObject,
      nullable: true,
      resolve: (parent, _args, ctx) => resolveDisplayAmountField(parent, ctx, "amount", "currency"),
    }),
    paymentDate: t.expose("paymentDate", { type: "DateTime" }),
    userPaymentMethodId: t.exposeString("userPaymentMethodId", { nullable: true }),
    paymentMethodType: t.field({
      type: PaymentMethodTypePothosEnum,
      resolve: parent => parent.paymentMethodType as PaymentMethodType,
    }),
    paymentMethodSnapshot: t.field({
      type: PaymentMethodTransactionSnapshotPothosObject,
      nullable: true,
      resolve: async (parent, _args, ctx) => {
        if (!parent.paymentMethodSnapshot) return null;
        if (parent.paymentMethodType === PaymentMethodType.PROOF_UPLOAD) return null;
        const revealSensitive = await shouldRevealPaymentSnapshot(ctx);
        return buildMaskedTransactionSnapshot(
          parent.paymentMethodSnapshot as PaymentMethodTransactionSnapshot,
          revealSensitive
        );
      },
    }),
    transactionId: t.exposeString("transactionId", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});

const TeacherPaymentRef = gqlSchemaBuilder.objectRef<TeacherPaymentSelectType>("TeacherPayment");

export const TeacherPaymentPothosObject = TeacherPaymentRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    teacherId: t.exposeString("teacherId"),
    amount: t.exposeString("amount"),
    currency: t.expose("currency", { type: CurrencyCodePothosObject }),
    paymentDate: t.expose("paymentDate", { type: "DateTime" }),
    userPaymentMethodId: t.exposeString("userPaymentMethodId", { nullable: true }),
    paymentMethodType: t.field({
      type: PaymentMethodTypePothosEnum,
      resolve: parent => parent.paymentMethodType as PaymentMethodType,
    }),
    paymentMethodSnapshot: t.field({
      type: PaymentMethodTransactionSnapshotPothosObject,
      nullable: true,
      resolve: async (parent, _args, ctx) => {
        if (!parent.paymentMethodSnapshot) return null;
        if (parent.paymentMethodType === PaymentMethodType.PROOF_UPLOAD) return null;
        const revealSensitive = await shouldRevealPaymentSnapshot(ctx);
        return buildMaskedTransactionSnapshot(
          parent.paymentMethodSnapshot as PaymentMethodTransactionSnapshot,
          revealSensitive
        );
      },
    }),
    isTestPayment: t.exposeBoolean("isTestPayment"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});
