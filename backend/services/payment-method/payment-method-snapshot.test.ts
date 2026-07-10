import { describe, expect, test } from "bun:test";
import { PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import {
  buildTransactionSnapshotFromInline,
  buildTransactionSnapshotFromMethod,
} from "@/backend/services/payment-method/payment-method-snapshot";
import type { UserPaymentMethodSelectType } from "@/backend/types/billing/payment-method.types";

describe("PaymentMethodSnapshotService", () => {
  test("builds inline cash snapshot for pay-in", () => {
    const snapshot = buildTransactionSnapshotFromInline(
      {
        type: PaymentMethodType.CASH,
        label: "Cash at desk",
        details: { note: "Front office" },
      },
      null,
      PaymentDirection.PAYIN
    );

    expect(snapshot.userPaymentMethodId).toBeNull();
    expect(snapshot.type).toBe(PaymentMethodType.CASH);
    expect(snapshot.direction).toBe(PaymentDirection.PAYIN);
    expect(snapshot.details).toEqual({ note: "Front office" });
    expect(snapshot.snapshottedAt).toBeTruthy();
  });

  test("builds snapshot from saved method", () => {
    const method: UserPaymentMethodSelectType = {
      id: "00000000-0000-0000-0000-000000000003",
      userId: "00000000-0000-0000-0000-000000000004",
      type: PaymentMethodType.CASH,
      direction: PaymentDirection.BOTH,
      isDefault: false,
      label: null,
      details: {},
      verifiedAt: null,
      verifiedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const snapshot = buildTransactionSnapshotFromMethod(method, null, PaymentDirection.PAYOUT);
    expect(snapshot.userPaymentMethodId).toBe(method.id);
    expect(snapshot.direction).toBe(PaymentDirection.PAYOUT);
  });
});
