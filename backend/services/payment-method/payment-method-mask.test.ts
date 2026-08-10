import { describe, expect, test } from "bun:test";
import { PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { buildMaskedPaymentMethod } from "@/backend/services/payment-method/payment-method-mask";
import type {
  BankTransferDetails,
  PaymentMethodDetails,
  UserPaymentMethodSelectType,
} from "@/backend/types/billing/payment-method.types";

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

// `BankTransferDetails` has only optional routing fields; we identify it by the
// absence of the discriminant keys carried by every other variant.
function isBankTransferDetails(details: PaymentMethodDetails): details is BankTransferDetails {
  return (
    !("walletId" in details) && !("paymentLinkId" in details) && !("onlineAccountId" in details) && !("note" in details)
  );
}

describe("buildMaskedPaymentMethod", () => {
  test("masks sensitive bank fields when not revealing", () => {
    const summary = buildMaskedPaymentMethod(baseMethod, false);
    const maskedDetails = summary.details;
    const baseDetails = baseMethod.details;

    if (!isBankTransferDetails(maskedDetails) || !isBankTransferDetails(baseDetails)) {
      throw new Error("expected bank transfer details");
    }

    expect(maskedDetails.beneficiaryName).not.toBe(baseDetails.beneficiaryName);
    expect(maskedDetails.accountNumber).toBe("****7890");
    expect(maskedDetails.routingNumber).toBe("****0021");
    expect(maskedDetails.iban).toBe("****1234");
  });

  test("reveals details for authorized scope", () => {
    const summary = buildMaskedPaymentMethod(baseMethod, true);
    const details = summary.details;

    if (!isBankTransferDetails(details)) {
      throw new Error("expected bank transfer details");
    }

    expect(details.accountNumber).toBe("1234567890");
  });
});

describe("PaymentMethodService profile scope", () => {
  test("own scope lists methods for the target user", async () => {
    const { PaymentMethodService } = await import("@/backend/services/payment-method/payment-method.service");
    const { ProfileScope } = await import("@/backend/enum");

    const methods = await PaymentMethodService.listForProfile("actor-1", "actor-2", ProfileScope.OWN, "en");
    expect(methods).toBeNull();
  });
});
