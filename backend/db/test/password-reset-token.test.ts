import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { testLogger } from "../../../lib/testlogger";
import type { PasswordResetTokenInsertInput } from "../../types";
import { db } from "../drizzleDb";
import { passwordResetTokens } from "../schema";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function runInRollback(fn: (tx: DbTransaction) => Promise<void>): Promise<void> {
  let assertionError: unknown = null;
  try {
    await db.transaction(async tx => {
      try {
        await fn(tx);
      } catch (error) {
        assertionError = error;
      }
      tx.rollback();
    });
  } catch {
    // Ignore expected Drizzle transaction rollback error
  }
  if (assertionError) {
    throw assertionError;
  }
}

describe("Password Reset Tokens", () => {
  test("Can insert multiple password reset tokens for the same email", async () => {
    testLogger.info("Starting multiple password reset tokens test...");
    await runInRollback(async tx => {
      const email = `reset-${randomUUID()}@example.com`;
      const now = new Date();
      const expires = new Date(now.getTime() + 3600000); // 1 hour later

      const tokenInput1: PasswordResetTokenInsertInput = {
        email,
        hashedToken: "hash123",
        createdAt: now,
        expiresAt: expires,
      };

      const tokenInput2: PasswordResetTokenInsertInput = {
        email,
        hashedToken: "hash456",
        createdAt: now,
        expiresAt: expires,
      };

      const [token1] = await tx.insert(passwordResetTokens).values(tokenInput1).returning();
      const [token2] = await tx.insert(passwordResetTokens).values(tokenInput2).returning();

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1.email).toBe(email);
      expect(token2.email).toBe(email);
      expect(token1.id).not.toBe(token2.id);

      testLogger.info("Successfully inserted multiple tokens for the same email.");
    });
  });
});
