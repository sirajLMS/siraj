import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { testLogger } from "../../../lib/testlogger";
import type { AdminAuditLogInsertInput, SessionEntityInput } from "../../types";
import { adminAuditLogs, sessions, users } from "../schema";
import { IP_ADDRESS_1 } from "./const";
import { runInRollback } from "./test-utils";

describe("IP Address Formatting", () => {
  const now = new Date();

  test("Valid IPv4 insertion in sessions", async () => {
    testLogger.info("Testing valid IPv4 insertion in sessions...");
    const email = `ip-test-${randomUUID()}@example.com`;

    await runInRollback(async tx => {
      const [user] = await tx
        .insert(users)
        .values({
          name: "IP Test User",
          email,
          password: "securePassword",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const validSession: SessionEntityInput = {
        hashedId: `session-${randomUUID()}`,
        userId: user.id,
        ipAddress: IP_ADDRESS_1,
        payload: "sessionPayload",
        lastActivity: 1000n,
      };
      const [insertedSession] = await tx.insert(sessions).values(validSession).returning();
      expect(insertedSession).toBeDefined();
      expect(insertedSession.ipAddress).toBe(IP_ADDRESS_1);
    });
  });

  test("Invalid IP address insertion in sessions", async () => {
    testLogger.info("Testing invalid IP address insertion in sessions...");
    const email = `ip-test-2-${randomUUID()}@example.com`;

    await runInRollback(async tx => {
      const [user] = await tx
        .insert(users)
        .values({
          name: "IP Test User 2",
          email,
          password: "securePassword",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const invalidSession: SessionEntityInput = {
        hashedId: `session-${randomUUID()}`,
        userId: user.id,
        ipAddress: "invalid-ip-format",
        payload: "sessionPayload",
        lastActivity: 1000n,
      };

      let sessionDidThrow = false;
      try {
        await tx.insert(sessions).values(invalidSession);
      } catch (error) {
        sessionDidThrow = true;
        const errorMessage = String(error);
        expect(
          errorMessage.includes("invalid input syntax for type inet") ||
            errorMessage.toLowerCase().includes("inet") ||
            errorMessage.includes("invalid")
        ).toBe(true);
      }
      expect(sessionDidThrow).toBe(true);
    });
  });

  test("Valid IPv6 insertion in audit logs", async () => {
    testLogger.info("Testing valid IPv6 insertion in audit logs...");
    const email = `ip-test-3-${randomUUID()}@example.com`;

    await runInRollback(async tx => {
      const [user] = await tx
        .insert(users)
        .values({
          name: "IP Test User 3",
          email,
          password: "securePassword",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const validAuditLog: AdminAuditLogInsertInput = {
        actorUserId: user.id,
        action: "TEST_ACTION",
        description: "Testing IP format",
        ipAddress: "2001:db8::1",
        createdAt: now,
      };
      const [insertedAudit] = await tx.insert(adminAuditLogs).values(validAuditLog).returning();
      expect(insertedAudit).toBeDefined();
      expect(insertedAudit.ipAddress).toBe("2001:db8::1");
    });
  });

  test("Invalid IP address insertion in audit logs", async () => {
    testLogger.info("Testing invalid IP address insertion in audit logs...");
    const email = `ip-test-4-${randomUUID()}@example.com`;

    await runInRollback(async tx => {
      const [user] = await tx
        .insert(users)
        .values({
          name: "IP Test User 4",
          email,
          password: "securePassword",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const invalidAuditLog: AdminAuditLogInsertInput = {
        actorUserId: user.id,
        action: "TEST_ACTION",
        description: "Testing IP format",
        ipAddress: "300.400.500.600",
        createdAt: now,
      };

      let auditDidThrow = false;
      try {
        await tx.insert(adminAuditLogs).values(invalidAuditLog);
      } catch (error) {
        auditDidThrow = true;
        testLogger.info(`Caught expected error: ${error}`);
      }
      expect(auditDidThrow).toBe(true);
    });
  });
});
