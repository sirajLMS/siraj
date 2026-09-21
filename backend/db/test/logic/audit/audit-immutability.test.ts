import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { adminAuditLogs, auditLogs, users } from "@/backend/db/schema";
import { expectSavepointError, generateTestPassword, runInRollback } from "@/backend/db/test/test-utils";
import { testLogger } from "@/shared/lib/logger/testlogger";

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
          password: generateTestPassword(),
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

  test("Maintenance window permits deletes only inside the opted-in transaction", async () => {
    testLogger.info("Starting audit log maintenance window validation test...");
    await runInRollback(async tx => {
      const now = new Date();
      const email = `audit-maintenance-${randomUUID()}@example.com`;

      const [actorUser] = await tx
        .insert(users)
        .values({
          name: "Audit Maintenance Actor",
          email,
          password: generateTestPassword(),
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [auditRecord] = await tx
        .insert(auditLogs)
        .values({
          actorUserId: actorUser.id,
          actorType: "USER",
          entityType: "TEST_ENTITY",
          entityId: randomUUID(),
          action: "INITIAL_INSERT",
          createdAt: now,
        })
        .returning();
      expect(auditRecord).toBeDefined();

      // 1. Without the maintenance GUC the delete is still forbidden.
      const blocked = await expectSavepointError(() => tx.delete(auditLogs).where(sql`id = ${auditRecord.id}`), tx);
      const { cause } = blocked;
      const detail = cause instanceof Error ? cause.message : blocked.message;
      expect(detail).toContain("Modifying or deleting audit logs is forbidden");

      // 2. Opting in via the transaction-local GUC opens the window for this
      //    transaction only — concurrent sessions keep full enforcement.
      await tx.execute(sql`SELECT set_config('app.audit_log_maintenance', 'on', true)`);
      await tx.delete(auditLogs).where(sql`id = ${auditRecord.id}`);
      const remaining = await tx.select({ id: auditLogs.id }).from(auditLogs).where(sql`id = ${auditRecord.id}`);
      expect(remaining).toHaveLength(0);

      testLogger.info("Successfully verified the transaction-scoped audit maintenance window.");
    });
  });
});
