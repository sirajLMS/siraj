import { beforeAll, describe, expect, test } from "bun:test";
import { SupportedPaymentLinkRepository } from "@/backend/db/repo/billing";
import { runInRollback } from "@/backend/db/test/test-utils";
import { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import { getErrorMessage } from "@/shared/utils/error";

let tErrors: ErrorsLabels;
beforeAll(() => {
  tErrors = getServerTranslations("en").errorsTranslations;
});

function loc(en: string) {
  return { en, ar: en };
}

describe("SupportedPaymentLinkRepository", () => {
  test("creates and filters active payment links by direction", async () => {
    await runInRollback(async tx => {
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

      expect(created).toBeDefined();
      expect(created.slug).toBe(slug);
      expect(created.id).toBeDefined();

      const fetched = await SupportedPaymentLinkRepository.getById(created.id, tx);
      expect(fetched).toBeDefined();
      expect(fetched?.urlAllowlist).toEqual(["paypal.com"]);

      const active = await SupportedPaymentLinkRepository.listActive({ direction: PaymentDirection.PAYOUT }, tx);
      expect(active.some(row => row.id === created.id)).toBe(true);

      const deactivated = await SupportedPaymentLinkRepository.deactivate(created.id, tErrors, tx);
      expect(deactivated).toBeDefined();
      expect(deactivated.isActive).toBe(false);
    });
  });

  test("update throws when payment link is missing", async () => {
    await runInRollback(async tx => {
      let errorThrown: unknown = null;
      try {
        await SupportedPaymentLinkRepository.update(
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
  });
});
