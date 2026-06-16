import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { testLogger } from "@/shared/lib/testlogger";
import type { AuthRateLimitEntityInput } from "../../types";
import { authRateLimits } from "../schema";
import { IP_ADDRESS_1 } from "./const";
import { runInRollback } from "./test-utils";

describe("Authentication Rate Limiting", () => {
  test("Composite unique constraint on IP and email prevents duplicates", async () => {
    testLogger.info("Starting authentication rate limit unique constraint test...");
    await runInRollback(async tx => {
      const email = `rate-${randomUUID()}@example.com`;
      const ipAddress = IP_ADDRESS_1;
      const now = new Date();

      const rateLimitInput1: AuthRateLimitEntityInput = {
        email,
        ipAddress,
        attempts: 1,
        createdAt: now,
        updatedAt: now,
      };

      const rateLimitInput2: AuthRateLimitEntityInput = {
        email,
        ipAddress,
        attempts: 2,
        createdAt: now,
        updatedAt: now,
      };

      // First insert should succeed
      await tx.insert(authRateLimits).values(rateLimitInput1);

      // Second insert with same IP and same email should throw unique constraint violation
      let didThrow = false;
      try {
        await tx.insert(authRateLimits).values(rateLimitInput2);
      } catch (error) {
        didThrow = true;
        testLogger.info(`Caught expected error: ${error}`);
        // The insert failed, which is what we expect - the unique constraint is working
      }
      expect(didThrow).toBe(true);
      testLogger.info("Successfully verified unique composite constraint on IP and email.");
    });
  });
});
