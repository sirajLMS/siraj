import { beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { UserRepository } from "@/backend/db/repo/users";

import { users } from "@/backend/db/schema";
import { createTestUserWithDefaults, runInRollback } from "@/backend/db/test/test-utils";
import { comparePassword, hashPassword } from "@/backend/lib/auth/password";
import type { DBTransaction } from "@/backend/types";
import { getErrorMessage } from "@/shared/utils/error";

const NONEXISTENT_ID = "00000000-0000-0000-0000-000000000000";

function generateTestPassword(): string {
  return `TestPass-${randomUUID().slice(0, 8)}!`;
}

let testPassword: string;

beforeAll(() => {
  testPassword = generateTestPassword();
});

async function fetchUserPasswordRow(tx: DBTransaction, userId: string) {
  const rows = await tx.select({ password: users.password }).from(users).where(eq(users.id, userId));
  return rows[0] ?? null;
}

describe("UserRepository.updatePassword", () => {
  test("persists the new hashed password and returns the updated user", async () => {
    await runInRollback(async (tx: DBTransaction) => {
      const user = await createTestUserWithDefaults(tx);
      const originalRow = await fetchUserPasswordRow(tx, user.id);
      const originalPassword = originalRow?.password ?? "";

      const hashedNew = await hashPassword(testPassword);
      const updated = await UserRepository.updatePassword(user.id, hashedNew, tx, "en");

      expect(updated).toBeDefined();
      expect(updated.id).toBe(user.id);

      const updatedRow = await fetchUserPasswordRow(tx, user.id);
      const updatedPassword = updatedRow?.password ?? "";
      expect(updatedPassword).not.toBe(originalPassword);
      expect(await comparePassword(testPassword, updatedPassword)).toBe(true);
      expect(await comparePassword(testPassword, originalPassword)).toBe(false);
    });
  });

  test("throws for a non-existent user", async () => {
    await runInRollback(async (tx: DBTransaction) => {
      const hashedNew = await hashPassword(testPassword);
      let errorThrown: unknown;
      try {
        await UserRepository.updatePassword(NONEXISTENT_ID, hashedNew, tx, "en");
      } catch (error) {
        errorThrown = error;
      }
      expect(errorThrown).toBeDefined();
      expect(getErrorMessage(errorThrown)).toContain(NONEXISTENT_ID);
    });
  });
});
