import { describe, expect, test } from "bun:test";
import type { DBTransaction } from "@/backend/db/db.types";
import { SupportedOnlineAccountRepository } from "@/backend/db/repo";
import { runInRollback } from "@/backend/db/test/test-utils";
import { IdentifierKind, PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import { getErrorMessage } from "@/shared/utils/error";

function loc(en: string) {
  return { en, ar: en };
}

function testRepo(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    await runInRollback(fn);
  });
}

describe("SupportedOnlineAccountRepository", () => {
  testRepo("creates and filters active online accounts", async tx => {
    const slug = `test-account-${crypto.randomUUID().slice(0, 8)}`;
    const created = await SupportedOnlineAccountRepository.create(
      {
        slug,
        name: loc("Test Account"),
        identifierKind: IdentifierKind.EMAIL,
        identifierLabel: loc("Email"),
        supportedDirections: PaymentDirection.BOTH,
        isActive: true,
      },
      tx
    );

    const bySlug = await SupportedOnlineAccountRepository.getBySlug(slug, tx);
    expect(bySlug?.identifierKind).toBe(IdentifierKind.EMAIL);

    const active = await SupportedOnlineAccountRepository.listActive({ direction: PaymentDirection.PAYIN }, tx);
    expect(active.some(row => row.id === created.id)).toBe(true);

    const updated = await SupportedOnlineAccountRepository.update(created.id, { logoUrl: "https://example.com/logo.png" }, tx);
    expect(updated.logoUrl).toBe("https://example.com/logo.png");
  });

  testRepo("deactivate throws when online account is missing", async tx => {
    let errorThrown: unknown = null;
    try {
      await SupportedOnlineAccountRepository.deactivate("recordNotFound", tx);
    } catch (error) {
      errorThrown = error;
    }
    expect(errorThrown).not.toBeNull();
    expect(getErrorMessage(errorThrown)).toContain("recordNotFound");
  });
});
