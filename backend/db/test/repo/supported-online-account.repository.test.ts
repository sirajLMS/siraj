import { beforeAll, describe, expect, test } from "bun:test";
import { SupportedOnlineAccountRepository } from "@/backend/db/repo";
import { runInRollback } from "@/backend/db/test/test-utils";
import { IdentifierKind, PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import { getErrorMessage } from "@/shared/utils/error";

let tErrors: ErrorsLabels;
beforeAll(() => {
  tErrors = getServerTranslations("en").errorsTranslations;
});

function loc(en: string) {
  return { en, ar: en };
}

describe("SupportedOnlineAccountRepository", () => {
  test("creates and filters active online accounts", async () => {
    await runInRollback(async tx => {
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

      expect(created).toBeDefined();
      expect(created.slug).toBe(slug);
      expect(created.id).toBeDefined();

      const bySlug = await SupportedOnlineAccountRepository.getBySlug(slug, tx);
      expect(bySlug).toBeDefined();
      expect(bySlug?.identifierKind).toBe(IdentifierKind.EMAIL);

      const active = await SupportedOnlineAccountRepository.listActive({ direction: PaymentDirection.PAYIN }, tx);
      expect(active.some(row => row.id === created.id)).toBe(true);

      const updated = await SupportedOnlineAccountRepository.update(
        created.id,
        { logoUrl: "https://example.com/logo.png" },
        tErrors,
        tx
      );
      expect(updated).toBeDefined();
      expect(updated.logoUrl).toBe("https://example.com/logo.png");
    });
  });

  test("deactivate throws when online account is missing", async () => {
    await runInRollback(async tx => {
      let errorThrown: unknown = null;
      try {
        await SupportedOnlineAccountRepository.deactivate("00000000-0000-0000-0000-000000000000", tErrors, tx);
      } catch (error) {
        errorThrown = error;
      }
      expect(errorThrown).not.toBeNull();
      expect(getErrorMessage(errorThrown)).toContain("00000000-0000-0000-0000-000000000000");
    });
  });
});
