import { describe, expect, test } from "bun:test";
import type { DBTransaction } from "@/backend/db/db.types";
import { UserPaymentMethodRepository } from "@/backend/db/repo";
import { createTestUser, runInRollback } from "@/backend/db/test/test-utils";
import { PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { getErrorMessage } from "@/shared/utils/error";

function testRepo(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    await runInRollback(fn);
  });
}

const badTx = {
  select: () => {
    throw new Error("Mock database error");
  },
  insert: () => {
    throw new Error("Mock database error");
  },
  update: () => {
    throw new Error("Mock database error");
  },
  delete: () => {
    throw new Error("Mock database error");
  },
} as unknown as DBTransaction;

describe("UserPaymentMethodRepository", () => {
  testRepo("creates, lists, updates, and deletes user payment methods", async tx => {
    const user = await createTestUser(tx);
    const created = await UserPaymentMethodRepository.create(
      {
        userId: user.id,
        type: PaymentMethodType.CASH,
        direction: PaymentDirection.PAYIN,
        isDefault: true,
        label: "Cash at office",
        details: { note: "Front desk" },
      },
      tx
    );

    expect(created.id).toBeDefined();
    expect(created.userId).toBe(user.id);

    const listed = await UserPaymentMethodRepository.listByUserId(user.id, tx);
    expect(listed.some(row => row.id === created.id)).toBe(true);

    const fetched = await UserPaymentMethodRepository.getById(created.id, tx);
    expect(fetched?.label).toBe("Cash at office");

    const updated = await UserPaymentMethodRepository.update(created.id, { label: "Updated label" }, tx);
    expect(updated.label).toBe("Updated label");

    await UserPaymentMethodRepository.deleteById(created.id, tx);
    const afterDelete = await UserPaymentMethodRepository.getById(created.id, tx);
    expect(afterDelete).toBeNull();
  });

  testRepo("clearDefaultsInSlot clears only the matching default slot", async tx => {
    const user = await createTestUser(tx);

    const payinDefault = await UserPaymentMethodRepository.create(
      {
        userId: user.id,
        type: PaymentMethodType.CASH,
        direction: PaymentDirection.PAYIN,
        isDefault: true,
        details: {},
      },
      tx
    );

    const payoutDefault = await UserPaymentMethodRepository.create(
      {
        userId: user.id,
        type: PaymentMethodType.BANK_TRANSFER,
        direction: PaymentDirection.PAYOUT,
        isDefault: true,
        details: { iban: "encrypted-placeholder" },
      },
      tx
    );

    await UserPaymentMethodRepository.clearDefaultsInSlot(user.id, "PAYIN", tx);

    const payinAfter = await UserPaymentMethodRepository.getById(payinDefault.id, tx);
    const payoutAfter = await UserPaymentMethodRepository.getById(payoutDefault.id, tx);

    expect(payinAfter?.isDefault).toBe(false);
    expect(payoutAfter?.isDefault).toBe(true);
  });

  testRepo("setVerified records verifier metadata", async tx => {
    const user = await createTestUser(tx);
    const admin = await createTestUser(tx);

    const method = await UserPaymentMethodRepository.create(
      {
        userId: user.id,
        type: PaymentMethodType.BANK_TRANSFER,
        direction: PaymentDirection.PAYOUT,
        isDefault: false,
        details: { iban: "encrypted-placeholder" },
      },
      tx
    );

    const verified = await UserPaymentMethodRepository.setVerified(method.id, admin.id, tx);
    expect(verified.verifiedAt).not.toBeNull();
    expect(verified.verifiedByUserId).toBe(admin.id);
  });

  testRepo("update throws when payment method is missing", async tx => {
    let errorThrown: unknown = null;
    try {
      await UserPaymentMethodRepository.update("00000000-0000-0000-0000-000000000000", { label: "missing" }, tx);
    } catch (error) {
      errorThrown = error;
    }
    expect(errorThrown).not.toBeNull();
    expect(getErrorMessage(errorThrown)).toContain("00000000-0000-0000-0000-000000000000");
  });

  test("listByUserId throws on database error", async () => {
    let errorThrown: unknown = null;
    try {
      await UserPaymentMethodRepository.listByUserId("00000000-0000-0000-0000-000000000000", badTx);
    } catch (error) {
      errorThrown = error;
    }
    expect(errorThrown).not.toBeNull();
    expect(getErrorMessage(errorThrown)).toContain("Mock database error");
  });
});
