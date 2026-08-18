/**
 * Tests for Generic Audit Trail System (Issue #20)
 *
 * This test suite verifies:
 * 1. Audit log creation for various entities
 * 2. Query and filtering capabilities
 * 3. Immutability enforcement (prevent updates/deletes)
 * 4. Convenience methods for common audit operations
 * 5. Transaction support
 * 6. Statistics and reporting
 */

import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { AuditRepository } from "@/backend/db/repo/audit";
import { auditLogs, users } from "@/backend/db/schema";
import { IP_ADDRESS_1 } from "@/backend/db/test/const";
import { runInRollback } from "@/backend/db/test/test-utils";
import { StudentStatus } from "@/backend/enum";
import type { CreateAuditLogInput, DBTransaction } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { testLogger } from "@/shared/lib/logger/testlogger";

/**
 * Creates a test user inside a transaction for audit trail tests.
 * Returns the user's id (the only field needed by AuditRepository).
 */
async function createAuditActor(tx: DBTransaction, name: string): Promise<string> {
  const now = new Date();
  const [user] = await tx
    .insert(users)
    .values({
      name,
      email: `audit-${randomUUID()}@example.com`,
      password: randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return user.id;
}

describe("Audit Trail System", () => {
  test("should create a basic audit log entry", async () => {
    await runInRollback(async tx => {
      const actorUserId = await createAuditActor(tx, "Audit Test User 1");

      const input = {
        actorUserId,
        actorType: "USER",
        entityType: "STUDENT",
        entityId: "[CARD_REDACTED]-[CARD_REDACTED]",
        action: "CREATE",
        description: "Created new student",
      } as CreateAuditLogInput;

      const auditLog = await AuditRepository.createAuditLog(input, tx);

      expect(auditLog).toBeDefined();
      expect(auditLog.id).toBeDefined();
      expect(auditLog.actorUserId).toBe(actorUserId);
      expect(auditLog.actorType).toBe("USER");
      expect(auditLog.entityType).toBe("STUDENT");
      expect(auditLog.action).toBe("CREATE");

      testLogger.info("Basic audit log created", { auditLogId: auditLog.id });
    });
  });

  test("should create audit log with state changes", async () => {
    await runInRollback(async tx => {
      const actorUserId = await createAuditActor(tx, "Audit Test User 1");

      const input = {
        actorUserId,
        actorType: "USER",
        entityType: "INVOICE",
        entityId: "[CARD_REDACTED]-[CARD_REDACTED]",
        action: "UPDATE",
        description: "Updated invoice amount",
        previousState: { amount: 100, currency: CurrencyCode.USD },
        newState: { amount: 150, currency: CurrencyCode.USD },
        changes: { amount: { from: 100, to: 150 } },
      } as CreateAuditLogInput;

      const auditLog = await AuditRepository.createAuditLog(input, tx);

      expect(auditLog.previousState).toEqual({ amount: 100, currency: CurrencyCode.USD });
      expect(auditLog.newState).toEqual({ amount: 150, currency: CurrencyCode.USD });
      expect(auditLog.changes).toEqual({ amount: { from: 100, to: 150 } });

      testLogger.info("Audit log with state changes created", { auditLogId: auditLog.id });
    });
  });

  test("should create audit log with metadata", async () => {
    await runInRollback(async tx => {
      const input = {
        actorUserId: null,
        actorType: "SYSTEM",
        entityType: "PAYMENT",
        entityId: "[CARD_REDACTED]-[CARD_REDACTED]",
        action: "REFUND",
        description: "Automatic refund processed",
        ipAddress: IP_ADDRESS_1,
        userAgent: "Mozilla/5.0",
        metadata: {
          refundAmount: 50,
          currency: CurrencyCode.USD,
          reason: "Duplicate payment",
        },
      } as CreateAuditLogInput;

      const auditLog = await AuditRepository.createAuditLog(input, tx);

      expect(auditLog.actorType).toBe("SYSTEM");
      expect(auditLog.actorUserId).toBeNull();
      expect(auditLog.ipAddress).toBe(IP_ADDRESS_1);
      expect(auditLog.metadata).toEqual({
        refundAmount: 50,
        currency: CurrencyCode.USD,
        reason: "Duplicate payment",
      });

      testLogger.info("Audit log with metadata created", { auditLogId: auditLog.id });
    });
  });

  test("should query audit logs with filters", async () => {
    await runInRollback(async tx => {
      const actorUserId = await createAuditActor(tx, "Audit Test User 1");

      // Create multiple audit logs
      await AuditRepository.createAuditLog(
        {
          actorUserId,
          actorType: "USER",
          entityType: "STUDENT",
          entityId: "[CARD_REDACTED]-[CARD_REDACTED]",
          action: "UPDATE",
        },
        tx
      );

      await AuditRepository.createAuditLog(
        {
          actorUserId,
          actorType: "USER",
          entityType: "STUDENT",
          entityId: "[CARD_REDACTED]-[CARD_REDACTED]",
          action: "DELETE",
        },
        tx
      );

      // Query by actor
      const result = await AuditRepository.queryAuditLogs(
        {
          actorUserId,
          entityType: "STUDENT",
        },
        tx
      );

      expect(result.logs.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
      testLogger.info("Query audit logs successful", { count: result.logs.length });
    });
  });

  test("should get entity audit logs", async () => {
    await runInRollback(async tx => {
      const actorUserId1 = await createAuditActor(tx, "Audit Test User 1");
      const actorUserId2 = await createAuditActor(tx, "Audit Test User 2");
      const entityId = "[CARD_REDACTED]-[CARD_REDACTED]";

      // Create multiple logs for the same entity
      await AuditRepository.createAuditLog(
        {
          actorUserId: actorUserId1,
          actorType: "USER",
          entityType: "INVOICE",
          entityId,
          action: "CREATE",
        },
        tx
      );

      await AuditRepository.createAuditLog(
        {
          actorUserId: actorUserId2,
          actorType: "USER",
          entityType: "INVOICE",
          entityId,
          action: "UPDATE",
        },
        tx
      );

      const logs = await AuditRepository.getEntityAuditLogs("INVOICE", entityId, 50, tx);

      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs.every(log => log.entityId === entityId)).toBe(true);
      testLogger.info("Entity audit logs retrieved", { count: logs.length });
    });
  });

  test("should get actor audit logs", async () => {
    await runInRollback(async tx => {
      const actorUserId = await createAuditActor(tx, "Audit Test User 1");

      await AuditRepository.createAuditLog(
        {
          actorUserId,
          actorType: "USER",
          entityType: "STUDENT",
          entityId: "[CARD_REDACTED]-[CARD_REDACTED]",
          action: "CREATE",
        },
        tx
      );

      const logs = await AuditRepository.getActorAuditLogs(actorUserId, 50, tx);

      expect(logs.length).toBeGreaterThan(0);
      expect(logs.every(log => log.actorUserId === actorUserId)).toBe(true);
      testLogger.info("Actor audit logs retrieved", { count: logs.length });
    });
  });

  test("should compute changes correctly", () => {
    const previousState = { name: "John", age: 30, city: "NYC" };
    const newState = { name: "John", age: 31, city: "LA" };

    const changes = AuditRepository.computeChanges(previousState, newState);

    expect(changes).toEqual({
      age: { from: 30, to: 31 },
      city: { from: "NYC", to: "LA" },
    });
    testLogger.info("Changes computed correctly");
  });

  test("should log student status change", async () => {
    await runInRollback(async tx => {
      const actorUserId = await createAuditActor(tx, "Audit Test User 1");
      const studentId = "[CARD_REDACTED]-[CARD_REDACTED]";

      const auditLog = await AuditRepository.logStudentStatusChange(
        {
          studentId,
          oldStatus: StudentStatus.REGULAR,
          newStatus: StudentStatus.SUSPENDED,
          actorUserId,
          description: "Student requested suspension",
        },
        tx
      );

      expect(auditLog.entityType).toBe("STUDENT");
      expect(auditLog.action).toBe("STATUS_CHANGE");
      expect(auditLog.previousState).toEqual({ status: "REGULAR" });
      expect(auditLog.newState).toEqual({ status: "SUSPENDED" });
      testLogger.info("Student status change logged", { auditLogId: auditLog.id });
    });
  });

  test("should log invoice change", async () => {
    await runInRollback(async tx => {
      const actorUserId = await createAuditActor(tx, "Audit Test User 1");
      const invoiceId = "[CARD_REDACTED]-[CARD_REDACTED]";

      const auditLog = await AuditRepository.logInvoiceChange(
        {
          invoiceId,
          action: "UPDATE",
          previousState: { amount: 100, status: "PENDING" },
          newState: { amount: 100, status: "PAID" },
          actorUserId,
          description: "Invoice payment confirmed",
        },
        tx
      );

      expect(auditLog.entityType).toBe("INVOICE");
      expect(auditLog.action).toBe("UPDATE");
      expect(auditLog.changes).toBeDefined();
      testLogger.info("Invoice change logged", { auditLogId: auditLog.id });
    });
  });

  test("should log payment refund", async () => {
    await runInRollback(async tx => {
      const actorUserId = await createAuditActor(tx, "Audit Test User 1");
      const paymentId = "[CARD_REDACTED]-[CARD_REDACTED]";

      const auditLog = await AuditRepository.logPaymentRefund(
        {
          paymentId,
          refundAmount: 50,
          currency: CurrencyCode.USD,
          actorUserId,
          reason: "Customer requested refund",
        },
        tx
      );

      expect(auditLog.entityType).toBe("PAYMENT");
      expect(auditLog.action).toBe("REFUND");
      expect(auditLog.metadata).toEqual({
        refundAmount: 50,
        currency: CurrencyCode.USD,
        reason: "Customer requested refund",
      });
      testLogger.info("Payment refund logged", { auditLogId: auditLog.id });
    });
  });

  test("should log permission change", async () => {
    await runInRollback(async tx => {
      const actorUserId = await createAuditActor(tx, "Audit Test User 1");
      const targetUserId = await createAuditActor(tx, "Audit Test User 2");

      const auditLog = await AuditRepository.logPermissionChange(
        {
          userId: targetUserId,
          action: "GRANT",
          permissionOrGroupId: "[CARD_REDACTED]-0000-00000000000a",
          permissionType: "PERMISSION_GROUP",
          actorUserId,
          description: "Added admin role",
        },
        tx
      );

      expect(auditLog.entityType).toBe("PERMISSION_GROUP");
      expect(auditLog.action).toBe("GRANT");
      expect(auditLog.metadata).toHaveProperty("targetUserId", targetUserId);
      testLogger.info("Permission change logged", { auditLogId: auditLog.id });
    });
  });

  test("should log exchange rate update", async () => {
    await runInRollback(async tx => {
      const actorUserId = await createAuditActor(tx, "Audit Test User 1");
      const rateId = "[CARD_REDACTED]-0000-00000000000b";

      const auditLog = await AuditRepository.logExchangeRateUpdate(
        {
          rateId,
          fromCurrency: CurrencyCode.USD,
          toCurrency: CurrencyCode.EUR,
          oldRate: 0.85,
          newRate: 0.87,
          actorUserId,
          source: "ECB",
        },
        tx
      );

      expect(auditLog.entityType).toBe("EXCHANGE_RATE");
      expect(auditLog.action).toBe("UPDATE");
      expect(auditLog.previousState).toEqual({ rate: 0.85 });
      expect(auditLog.newState).toEqual({ rate: 0.87 });
      testLogger.info("Exchange rate update logged", { auditLogId: auditLog.id });
    });
  });

  test("should log system setting change", async () => {
    await runInRollback(async tx => {
      const actorUserId = await createAuditActor(tx, "Audit Test User 1");

      const auditLog = await AuditRepository.logSystemSettingChange(
        {
          settingKey: "max_students_per_teacher",
          oldValue: 10,
          newValue: 15,
          actorUserId,
          description: "Increased capacity",
        },
        tx
      );

      expect(auditLog.entityType).toBe("SYSTEM_SETTING");
      expect(auditLog.action).toBe("UPDATE");
      expect(auditLog.changes).toEqual({ value: { from: 10, to: 15 } });
      testLogger.info("System setting change logged", { auditLogId: auditLog.id });
    });
  });

  test("should support transactional audit logging", async () => {
    await runInRollback(async tx => {
      const actorUserId = await createAuditActor(tx, "Audit Test User 1");

      const auditLog1 = await AuditRepository.createAuditLog(
        {
          actorUserId,
          actorType: "USER",
          entityType: "STUDENT",
          entityId: "[CARD_REDACTED]-0000-00000000000c",
          action: "CREATE",
        },
        tx
      );

      const auditLog2 = await AuditRepository.createAuditLog(
        {
          actorUserId,
          actorType: "USER",
          entityType: "STUDENT",
          entityId: "[CARD_REDACTED]-0000-00000000000c",
          action: "UPDATE",
        },
        tx
      );

      expect(auditLog1).toBeDefined();
      expect(auditLog2).toBeDefined();
      testLogger.info("Transactional audit logging successful");
    });
  });

  test("should get audit statistics", async () => {
    await runInRollback(async tx => {
      const actorUserId = await createAuditActor(tx, "Audit Test User 1");

      await AuditRepository.createAuditLog(
        {
          actorUserId,
          actorType: "USER",
          entityType: "STUDENT",
          entityId: "[CARD_REDACTED]-[CARD_REDACTED]",
          action: "CREATE",
        },
        tx
      );

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const stats = await AuditRepository.getAuditStatistics(yesterday, now, tx);

      expect(stats.length).toBeGreaterThan(0);
      expect(stats[0]).toHaveProperty("entityType");
      expect(stats[0]).toHaveProperty("action");
      expect(stats[0]).toHaveProperty("count");
      testLogger.info("Audit statistics retrieved", { statsCount: stats.length });
    });
  });

  test("should prevent audit log updates (immutability)", async () => {
    await runInRollback(async tx => {
      const actorUserId = await createAuditActor(tx, "Audit Test User 1");

      // Create an audit log
      const auditLog = await AuditRepository.createAuditLog(
        {
          actorUserId,
          actorType: "USER",
          entityType: "STUDENT",
          entityId: "[CARD_REDACTED]-0000-00000000000d",
          action: "CREATE",
          description: "Original description",
        },
        tx
      );

      // Attempt to update should fail
      let updateThrew = false;
      try {
        await tx.update(auditLogs).set({ description: "Modified description" }).where(sql`id = ${auditLog.id}`);
      } catch {
        updateThrew = true;
      }

      expect(updateThrew).toBe(true);
      testLogger.info("Audit log update prevented (immutability enforced)");
    });
  });

  test("should prevent audit log deletion (immutability)", async () => {
    await runInRollback(async tx => {
      const actorUserId = await createAuditActor(tx, "Audit Test User 1");

      // Create an audit log
      const auditLog = await AuditRepository.createAuditLog(
        {
          actorUserId,
          actorType: "USER",
          entityType: "STUDENT",
          entityId: "[CARD_REDACTED]-0000-00000000000e",
          action: "DELETE",
        },
        tx
      );

      // Attempt to delete should fail
      let deleteThrew = false;
      try {
        await tx.delete(auditLogs).where(sql`id = ${auditLog.id}`);
      } catch {
        deleteThrew = true;
      }

      expect(deleteThrew).toBe(true);
      testLogger.info("Audit log deletion prevented (immutability enforced)");
    });
  });

  test("should get recent audit logs", async () => {
    await runInRollback(async tx => {
      const actorUserId = await createAuditActor(tx, "Audit Test User 1");

      await AuditRepository.createAuditLog(
        {
          actorUserId,
          actorType: "USER",
          entityType: "STUDENT",
          entityId: "[CARD_REDACTED]-[CARD_REDACTED]",
          action: "CREATE",
        },
        tx
      );

      const recentLogs = await AuditRepository.getRecentAuditLogs(10, tx);

      expect(recentLogs.length).toBeGreaterThan(0);
      expect(recentLogs.length).toBeLessThanOrEqual(10);

      // Check that logs are ordered by createdAt desc
      for (let i = 1; i < recentLogs.length; i++) {
        expect(recentLogs[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(recentLogs[i].createdAt.getTime());
      }

      testLogger.info("Recent audit logs retrieved", { count: recentLogs.length });
    });
  });

  test("should handle pagination in queries", async () => {
    await runInRollback(async tx => {
      const actorUserId = await createAuditActor(tx, "Audit Test User 1");

      // Create enough logs for pagination
      await Array.from({ length: 7 }, (_, i) => i).reduce(async (prev, i) => {
        await prev;
        await AuditRepository.createAuditLog(
          {
            actorUserId,
            actorType: "USER",
            entityType: "INVOICE",
            entityId: `[CARD_REDACTED]-[CARD_REDACTED]-${i}`,
            action: "CREATE",
          },
          tx
        );
      }, Promise.resolve());

      // Query first page
      const page1 = await AuditRepository.queryAuditLogs(
        {
          limit: 5,
          offset: 0,
        },
        tx
      );

      expect(page1.logs.length).toBeGreaterThan(0);
      expect(page1.total).toBeGreaterThan(0);

      // Query second page
      const page2 = await AuditRepository.queryAuditLogs(
        {
          limit: 5,
          offset: 5,
        },
        tx
      );

      // Ensure pages don't overlap
      if (page1.logs.length > 0 && page2.logs.length > 0) {
        expect(page1.logs[0].id).not.toBe(page2.logs[0].id);
      }

      testLogger.info("Pagination working correctly", {
        page1Count: page1.logs.length,
        page2Count: page2.logs.length,
      });
    });
  });

  test("should filter by date range", async () => {
    await runInRollback(async tx => {
      const actorUserId = await createAuditActor(tx, "Audit Test User 1");

      await AuditRepository.createAuditLog(
        {
          actorUserId,
          actorType: "USER",
          entityType: "STUDENT",
          entityId: "[CARD_REDACTED]-[CARD_REDACTED]",
          action: "CREATE",
        },
        tx
      );

      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const result = await AuditRepository.queryAuditLogs(
        {
          startDate: twoDaysAgo,
          endDate: now,
        },
        tx
      );

      expect(result.logs.length).toBeGreaterThan(0);

      // All logs should be within the date range
      for (const log of result.logs) {
        expect(log.createdAt.getTime()).toBeGreaterThanOrEqual(twoDaysAgo.getTime());
        expect(log.createdAt.getTime()).toBeLessThanOrEqual(now.getTime());
      }

      testLogger.info("Date range filtering working", { count: result.logs.length });
    });
  });

  test("should filter by multiple criteria", async () => {
    await runInRollback(async tx => {
      const actorUserId = await createAuditActor(tx, "Audit Test User 1");
      const entityId = "[CARD_REDACTED]-0000-00000000000f";

      // Create specific audit logs
      await AuditRepository.createAuditLog(
        {
          actorUserId,
          actorType: "USER",
          entityType: "INVOICE",
          entityId,
          action: "CREATE",
        },
        tx
      );

      await AuditRepository.createAuditLog(
        {
          actorUserId,
          actorType: "USER",
          entityType: "INVOICE",
          entityId,
          action: "UPDATE",
        },
        tx
      );

      // Query with multiple filters
      const result = await AuditRepository.queryAuditLogs(
        {
          actorUserId,
          entityType: "INVOICE",
          entityId,
          action: "UPDATE",
        },
        tx
      );

      expect(result.logs.length).toBeGreaterThanOrEqual(1);
      expect(result.logs.every(log => log.actorUserId === actorUserId)).toBe(true);
      expect(result.logs.every(log => log.entityType === "INVOICE")).toBe(true);
      expect(result.logs.every(log => log.action === "UPDATE")).toBe(true);

      testLogger.info("Multiple criteria filtering working", { count: result.logs.length });
    });
  });
});
