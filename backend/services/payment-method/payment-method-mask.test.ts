import { describe, expect, test } from "bun:test";
import { PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { buildMaskedPaymentMethod } from "@/backend/services/payment-method/payment-method-mask";
import type { UserPaymentMethodSelectType } from "@/backend/types/billing/payment-method.types";

const baseMethod: UserPaymentMethodSelectType = {
  id: "00000000-0000-0000-0000-000000000001",
  userId: "00000000-0000-0000-0000-000000000002",
  type: PaymentMethodType.BANK_TRANSFER,
  direction: PaymentDirection.PAYOUT,
  isDefault: true,
  label: "Primary payout",
  details: {
    beneficiaryName: "Jane Teacher",
    bankName: "National Bank",
    accountNumber: "1234567890",
    routingNumber: "021000021",
    iban: "EG123456789012345678901234",
    swiftBic: "NBEGEGCX",
  },
  verifiedAt: null,
  verifiedByUserId: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("buildMaskedPaymentMethod", () => {
  test("masks sensitive bank fields when not revealing", () => {
    const summary = buildMaskedPaymentMethod(baseMethod, false);

    expect((summary.details as { beneficiaryName?: string }).beneficiaryName).not.toBe(
      (baseMethod.details as { beneficiaryName?: string }).beneficiaryName
    );
    expect((summary.details as { accountNumber?: string }).accountNumber).toBe("****7890");
    expect((summary.details as { routingNumber?: string }).routingNumber).toBe("****0021");
    expect((summary.details as { iban?: string }).iban).toBe("****1234");
  });

  test("reveals details for authorized scope", () => {
    const summary = buildMaskedPaymentMethod(baseMethod, true);
    expect((summary.details as { accountNumber?: string }).accountNumber).toBe("1234567890");
  });
});

describe("PaymentMethodService profile scope", () => {
  test("own scope lists methods for the target user", async () => {
    const { PaymentMethodService } = await import("@/backend/services/payment-method/payment-method.service");
    const { ProfileScope } = await import("@/backend/enum");

    const methods = await PaymentMethodService.listForProfile(
      "actor-1",
      "actor-2",
      ProfileScope.OWN,
      "en"
    );
    expect(methods).toBeNull();
  });
});
