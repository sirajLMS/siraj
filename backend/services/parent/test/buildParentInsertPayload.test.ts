import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { buildParentInsertPayload } from "@/backend/services/parent/__shared__/buildParentInsertPayload";
import type { ParentOnboardingInput } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";

function createDummyPassword(): string {
  return `TestPass-${randomUUID().slice(0, 8)}!`;
}

describe("buildParentInsertPayload", () => {
  test("builds insert payload with custom provided fields", () => {
    const input: ParentOnboardingInput = {
      name: "John Doe",
      email: "john@example.com",
      password: createDummyPassword(),
      status: "VIP",
      nationality: "American",
      address: "123 Main St",
      facebook: "https://facebook.com/johndoe",
      whatsapp: "+1234567890",
      twitter: "@johndoe",
      invoiceType: "MONTHLY",
      feeAmount: "150.00",
      currency: CurrencyCode.USD,
    };
    const userId = "usr_12345";

    const payload = buildParentInsertPayload(input, userId);

    expect(payload.userId).toBe("usr_12345");
    expect(payload.status).toBe("VIP");
    expect(payload.nationality).toBe("American");
    expect(payload.address).toBe("123 Main St");
    expect(payload.facebook).toBe("https://facebook.com/johndoe");
    expect(payload.whatsapp).toBe("+1234567890");
    expect(payload.twitter).toBe("@johndoe");
    expect(payload.invoiceType).toBe("MONTHLY");
    expect(payload.feeAmount).toBe("150.00");
    expect(payload.currency).toBe(CurrencyCode.USD);
    expect(payload.createdAt).toBeInstanceOf(Date);
    expect(payload.updatedAt).toBeInstanceOf(Date);
  });

  test("uses default values when optional fields are missing or undefined", () => {
    const input: ParentOnboardingInput = {
      name: "Jane Doe",
      email: "jane@example.com",
      password: createDummyPassword(),
    };
    const userId = "usr_67890";

    const payload = buildParentInsertPayload(input, userId);

    expect(payload.userId).toBe("usr_67890");
    expect(payload.status).toBe("REGULAR");
    expect(payload.nationality).toBeNull();
    expect(payload.address).toBeNull();
    expect(payload.facebook).toBeNull();
    expect(payload.whatsapp).toBeNull();
    expect(payload.twitter).toBeNull();
    expect(payload.invoiceType).toBeNull();
    expect(payload.feeAmount).toBeNull();
    expect(payload.currency).toBeNull();
    expect(payload.createdAt).toBeInstanceOf(Date);
    expect(payload.updatedAt).toBeInstanceOf(Date);
  });

  test("preserves null values when optional fields are explicitly null", () => {
    const input: ParentOnboardingInput = {
      name: "Sam Smith",
      email: "sam@example.com",
      password: createDummyPassword(),
      status: null,
      nationality: null,
      address: null,
      facebook: null,
      whatsapp: null,
      twitter: null,
      invoiceType: null,
      feeAmount: null,
      currency: null,
    };
    const userId = "usr_99999";

    const payload = buildParentInsertPayload(input, userId);

    expect(payload.userId).toBe("usr_99999");
    expect(payload.status).toBe("REGULAR");
    expect(payload.nationality).toBeNull();
    expect(payload.address).toBeNull();
    expect(payload.facebook).toBeNull();
    expect(payload.whatsapp).toBeNull();
    expect(payload.twitter).toBeNull();
    expect(payload.invoiceType).toBeNull();
    expect(payload.feeAmount).toBeNull();
    expect(payload.currency).toBeNull();
    expect(payload.createdAt).toBeInstanceOf(Date);
    expect(payload.updatedAt).toBeInstanceOf(Date);
  });
});
