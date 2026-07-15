import { beforeAll, describe, expect, test } from "bun:test";
import type { DBTransaction } from "@/backend/db/db.types";
import { SupportedMobileWalletRepository } from "@/backend/db/repo";
import { runInRollback } from "@/backend/db/test/test-utils";
import { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import { getServerTranslations } from "@/shared/locale/server-graphql";
import type { ErrorsLabels } from "@/shared/locale/types/errors";
import { getErrorMessage } from "@/shared/utils/error";

let tErrors: ErrorsLabels;
beforeAll(async () => {
  tErrors = await getServerTranslations("en", "errors");
});

function loc(en: string) {
  return { en, ar: en };
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
} as unknown as DBTransaction;

describe("SupportedMobileWalletRepository", () => {
  testRepo("creates, lists active, updates, and deactivates wallets", async tx => {
    const slug = `test-wallet-${crypto.randomUUID().slice(0, 8)}`;
    const created = await SupportedMobileWalletRepository.create(
      {
        slug,
        name: loc("Test Wallet"),
        supportedDirections: PaymentDirection.PAYIN,
        isActive: true,
      },
      tx
    );

    expect(created).toBeDefined();
    expect(created.slug).toBe(slug);
    expect(created.id).toBeDefined();

    const bySlug = await SupportedMobileWalletRepository.getBySlug(slug, tx);
    expect(bySlug).toBeDefined();
    expect(bySlug?.id).toBe(created.id);

    const active = await SupportedMobileWalletRepository.listActive({ direction: PaymentDirection.PAYIN }, tx);
    expect(active.some(row => row.id === created.id)).toBe(true);

    const updated = await SupportedMobileWalletRepository.update(created.id, { phoneRegion: "EG" }, tErrors, tx);
    expect(updated).toBeDefined();
    expect(updated.phoneRegion).toBe("EG");

    const deactivated = await SupportedMobileWalletRepository.deactivate(created.id, tErrors, tx);
    expect(deactivated).toBeDefined();
    expect(deactivated.isActive).toBe(false);
  });

  testRepo("update throws when wallet is missing", async tx => {
    let errorThrown: unknown = null;
    try {
      await SupportedMobileWalletRepository.update(
        "00000000-0000-0000-0000-000000000000",
        { isActive: false },
        tErrors,
        tx
      );
    } catch (error) {
      errorThrown = error;
    }
    expect(errorThrown).not.toBeNull();
    expect(getErrorMessage(errorThrown)).toContain("00000000-0000-0000-0000-000000000000");
  });

  test("listAll throws on database error", async () => {
    let errorThrown: unknown = null;
    try {
      await SupportedMobileWalletRepository.listAll(badTx);
    } catch (error) {
      errorThrown = error;
    }
    expect(errorThrown).not.toBeNull();
    expect(getErrorMessage(errorThrown)).toContain("Mock database error");
  });
});
