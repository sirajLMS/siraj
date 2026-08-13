import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { UserRepository } from "@/backend/db/repo/users";
import { users } from "@/backend/db/schema";
import { createTestUserWithDefaults, runInRollback } from "@/backend/db/test/test-utils";
import type { DBTransaction } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { getErrorMessage } from "@/shared/utils/error";

describe("UserRepository", () => {
  test("updateDisplayCurrency persists and returns the updated user", async () => {
    await runInRollback(async (tx: DBTransaction) => {
      const user = await createTestUserWithDefaults(tx);
      expect(user.displayCurrency).toBeNull();

      const updated = await UserRepository.updateDisplayCurrency(user.id, CurrencyCode.EGP, tx);
      expect(updated.displayCurrency).toBe(CurrencyCode.EGP);

      const [row] = await tx
        .select({ displayCurrency: users.displayCurrency })
        .from(users)
        .where(eq(users.id, user.id));
      expect(row?.displayCurrency).toBe(CurrencyCode.EGP);
    });
  });

  test("updateDisplayCurrency throws when user is missing", async () => {
    await runInRollback(async (tx: DBTransaction) => {
      let errorThrown: unknown = null;
      try {
        await UserRepository.updateDisplayCurrency("00000000-0000-0000-0000-000000000000", CurrencyCode.USD, tx);
      } catch (error) {
        errorThrown = error;
      }
      expect(errorThrown).not.toBeNull();
      expect(getErrorMessage(errorThrown)).toContain("00000000-0000-0000-0000-000000000000");
    });
  });
});
