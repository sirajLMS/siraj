import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { testLogger } from "@/shared/lib/testlogger";
import { adminAuditLogs, users } from "../../schema";
import { runInRollback } from "../test-utils";

describe("Audit Log Immutability", () => {
  test("Trigger blocks update and delete operations on admin_audit_logs", async () => {
    testLogger.info("Starting audit log immutability trigger validation test...");
    await runInRollback(async tx => {
      const now = new Date();
      const email = `audit-actor-${randomUUID()}@example.com`;

      // 1. Create a user to act as actorUserId
      const [actorUser] = await tx
        .insert(users)
        .values({
          name: "Audit Log Actor",
          email,
          password: "securePassword",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // 2. Insert audit log record
      const [auditRecord] = await tx
        .insert(adminAuditLogs)
        .values({
          actorUserId: actorUser.id,
          action: "INITIAL_INSERT",
          description: "Test log for immutability",
          createdAt: now,
        })
        .returning();
      expect(auditRecord).toBeDefined();

      // 3. Attempt UPDATE on the audit log record (should fail)
      let updateDidThrow = false;
      try {
        await tx.update(adminAuditLogs).set({ description: "Modified description" }).where(sql`id = ${auditRecord.id}`);
      } catch (error) {
        updateDidThrow = true;
        const errorMessage = String(error);
        // Check for either the custom trigger message or a general update error
        expect(
          errorMessage.includes("Modifying or deleting audit logs is forbidden") ||
            errorMessage.includes("admin_audit_logs") ||
            errorMessage.toLowerCase().includes("trigger")
        ).toBe(true);
      }
      expect(updateDidThrow).toBe(true);

      // 4. Attempt DELETE on the audit log record (should fail)
      let deleteDidThrow = false;
      try {
        await tx.delete(adminAuditLogs).where(sql`id = ${auditRecord.id}`);
      } catch (error) {
        deleteDidThrow = true;
        const errorMessage = String(error);
        // Check for either the custom trigger message or a general delete error
        expect(
          errorMessage.includes("Modifying or deleting audit logs is forbidden") ||
            errorMessage.includes("admin_audit_logs") ||
            errorMessage.toLowerCase().includes("trigger")
        ).toBe(true);
      }
      expect(deleteDidThrow).toBe(true);

      testLogger.info("Successfully verified update and delete blocks on admin_audit_logs.");
    });
  });
});
