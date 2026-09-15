import { AppPermission } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { DisplayAmountPothosObject } from "@/backend/graphql/pothos/billing/fx-display.pothos";
import { PaymentMethodTransactionSnapshotPothosObject } from "@/backend/graphql/pothos/billing/payment-method.pothos";
import type { PothosObjectFieldBuilder } from "@/backend/graphql/pothos/shared/builder-types";
import { CurrencyCodePothosObject, PaymentMethodTypePothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import { buildMaskedTransactionSnapshot, PermissionsService } from "@/backend/services";
import type { PaymentFieldShape, PaymentMethodTransactionSnapshot, SnapshotUnion } from "@/backend/types";

function isMethodTransactionSnapshot(snapshot: SnapshotUnion | null): snapshot is PaymentMethodTransactionSnapshot {
  if (!snapshot) return false;
  return !("proof" in snapshot);
}

async function shouldRevealPaymentSnapshot(ctx: BaseContext): Promise<boolean> {
  if (!ctx.user?.id) return false;
  return PermissionsService.hasPermission(ctx.user.id, AppPermission.BILLING_UPDATE_STATUS_PAID);
}

/**
 * Shared field definitions for payment-related Pothos objects.
 * Used by both PaymentPothosObject (student payments) and
 * TeacherPaymentPothosObject to eliminate field-level duplication.
 *
 * Returns the common fields object; callers spread it alongside
 * their own type-specific fields (e.g. `invoiceId`, `teacherId`).
 */
export function paymentFields(t: PothosObjectFieldBuilder<PaymentFieldShape>) {
  return {
    amount: t.exposeString("amount"),
    currency: t.expose("currency", { type: CurrencyCodePothosObject }),
    displayAmount: t.expose("displayAmount", {
      type: DisplayAmountPothosObject,
      nullable: true,
    }),
    paymentDate: t.expose("paymentDate", { type: "DateTime" }),
    userPaymentMethodId: t.exposeString("userPaymentMethodId", { nullable: true }),
    paymentMethodType: t.field({
      type: PaymentMethodTypePothosEnum,
      resolve: parent => parent.paymentMethodType,
    }),
    paymentMethodSnapshot: t.field({
      type: PaymentMethodTransactionSnapshotPothosObject,
      nullable: true,
      resolve: async (parent, _args, ctx) => {
        if (!isMethodTransactionSnapshot(parent.paymentMethodSnapshot)) return null;
        const revealSensitive = await shouldRevealPaymentSnapshot(ctx);
        return buildMaskedTransactionSnapshot(parent.paymentMethodSnapshot, revealSensitive);
      },
    }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  };
}
