import { describe, expect, test } from "bun:test";
import type { DBTransaction } from "@/backend/db/db.types";
import { SupportedPaymentLinkRepository } from "@/backend/db/repo";
import { runInRollback } from "@/backend/db/test/test-utils";
import { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import { getErrorMessage } from "@/shared/utils/error";

function loc(en: string) {
  return { en, ar: en };
}

function testRepo(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    await runInRollback(fn);
  });
}

describe("SupportedPaymentLinkRepository", () => {
  testRepo("creates and filters active payment links by direction", async tx => {
    const slug = `test-link-${crypto.randomUUID().slice(0, 8)}`;
    const created = await SupportedPaymentLinkRepository.create(
      {
        slug,
        name: loc("Test Link"),
        urlAllowlist: ["paypal.com"],
        supportedDirections: PaymentDirection.PAYOUT,
        isActive: true,
      },
      tx
    );

    const fetched = await SupportedPaymentLinkRepository.getById(created.id, tx);
    expect(fetched?.urlAllowlist).toEqual(["paypal.com"]);

    const active = await SupportedPaymentLinkRepository.listActive({ direction: PaymentDirection.PAYOUT }, tx);
    expect(active.some(row => row.id === created.id)).toBe(true);

    const deactivated = await SupportedPaymentLinkRepository.deactivate(created.id, tx);
    expect(deactivated.isActive).toBe(false);
  });

  testRepo("update throws when payment link is missing", async tx => {
    let errorThrown: unknown = null;
    try {
      await SupportedPaymentLinkRepository.update("recordNotFound", { isActive: false }, tx);
    } catch (error) {
      errorThrown = error;
    }
    expect(errorThrown).not.toBeNull();
    expect(getErrorMessage(errorThrown)).toContain("recordNotFound");
  });
});
