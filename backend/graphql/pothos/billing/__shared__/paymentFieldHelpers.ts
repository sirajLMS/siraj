import type { ObjectFieldBuilder } from "@pothos/core";
import { AppPermission, type CurrencyCode } from "@/backend/enum";
import type { PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import type { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { DisplayAmountPothosObject } from "@/backend/graphql/pothos/billing/fx-display.pothos";
import { PaymentMethodTransactionSnapshotPothosObject } from "@/backend/graphql/pothos/billing/payment-method.pothos";
import { CurrencyCodePothosObject, PaymentMethodTypePothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import { PermissionsService } from "@/backend/services";
import { buildMaskedTransactionSnapshot } from "@/backend/services/payment-method/payment-method-mask";
import type { DisplayAmountReturnType } from "@/backend/types/billing/billing.types";
import type {
  PaymentMethodTransactionSnapshot,
  PaymentProofTransactionSnapshot,
} from "@/backend/types/billing/payment-method.types";

type SnapshotUnion = PaymentMethodTransactionSnapshot | PaymentProofTransactionSnapshot;

function isMethodTransactionSnapshot(snapshot: SnapshotUnion | null): snapshot is PaymentMethodTransactionSnapshot {
  if (!snapshot) return false;
  return !("proof" in snapshot);
}

type BuilderTypes = typeof gqlSchemaBuilder extends { $inferSchemaTypes: infer T } ? T : never;
type PothosObjectFieldBuilder<ParentShape> = ObjectFieldBuilder<BuilderTypes, ParentShape>;

/**
 * Shared shape covering the fields common to both PaymentReturnType and
 * TeacherPaymentReturnType. Constraining the field builder's `expose`/`field`
 * calls so they type-check correctly.
 */
interface PaymentFieldShape {
  readonly amount: string;
  readonly currency: CurrencyCode;
  readonly displayAmount?: DisplayAmountReturnType | null;
  readonly paymentDate: Date;
  readonly userPaymentMethodId: string | null;
  readonly paymentMethodType: PaymentMethodType;
  readonly paymentMethodSnapshot: PaymentMethodTransactionSnapshot | PaymentProofTransactionSnapshot | null;
  readonly createdAt: Date;
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
