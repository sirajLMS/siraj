import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { passwordResetTokens } from "@/backend/db/schema";
import { runInRollback } from "@/backend/db/test/test-utils";
import type { PasswordResetTokenInsertType } from "@/backend/types/auth/auth.types";
import { testLogger } from "@/shared/lib/logger/testlogger";

describe("Password Reset Tokens", () => {
  test("Can insert multiple password reset tokens for the same email", async () => {
    testLogger.info("Starting multiple password reset tokens test...");
    await runInRollback(async tx => {
      const email = `reset-${randomUUID()}@example.com`;
      const now = new Date();
      const expires = new Date(now.getTime() + 3600000); // 1 hour later

      const tokenInput1: PasswordResetTokenInsertType = {
        email,
        hashedToken: "hash123",
        createdAt: now,
        expiresAt: expires,
      };

      const tokenInput2: PasswordResetTokenInsertType = {
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
