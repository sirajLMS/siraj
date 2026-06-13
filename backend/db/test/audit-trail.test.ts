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

import { beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { testLogger } from "../../../lib/testlogger";
import type * as Types from "../../types";
import { db } from "../drizzleDb";
import { AuditRepository } from "../repo";
import { auditLogs, users } from "../schema";
import { IP_ADDRESS_1 } from "./const";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

describe("Audit Trail System", () => {
  let testUser1: Types.UserEntity;
  let testUser2: Types.UserEntity;

  beforeAll(async () => {
    testLogger.info("Setting up test users for audit trail tests");

    await db.transaction(async tx => {
      // Create test users with unique emails using randomUUID to avoid conflicts
      const now = new Date();
      const uniqueId1 = randomUUID();
      const uniqueId2 = randomUUID();

      [testUser1] = await tx
        .insert(users)
        .values({
          name: "Audit Test User 1",
          email: `audit.test1.${uniqueId1}@example.com`,
          password: "hashed_password",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      [testUser2] = await tx
        .insert(users)
        .values({
          name: "Audit Test User 2",
          email: `audit.test2.${uniqueId2}@example.com`,
          password: "hashed_password",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      testLogger.info("Test users created", { user1: testUser1.id, user2: testUser2.id });
    });
  });

  test("should create a basic audit log entry", async () => {
    const input: Types.CreateAuditLogInput = {
      actorUserId: testUser1.id,
      actorType: "USER",
      entityType: "STUDENT",
      entityId: "00000000-0000-0000-0000-000000000001",
      action: "CREATE",
      description: "Created new student",
    };

    const auditLog = await AuditRepository.createAuditLog(input);

    expect(auditLog).toBeDefined();
    expect(auditLog.id).toBeDefined();
    expect(auditLog.actorUserId).toBe(testUser1.id);
    expect(auditLog.actorType).toBe("USER");
    expect(auditLog.entityType).toBe("STUDENT");
    expect(auditLog.action).toBe("CREATE");

    testLogger.info("Basic audit log created", { auditLogId: auditLog.id });
  });

  test("should create audit log with state changes", async () => {
    const input: Types.CreateAuditLogInput = {
      actorUserId: testUser1.id,
      actorType: "USER",
      entityType: "INVOICE",
      entityId: "00000000-0000-0000-0000-000000000002",
      action: "UPDATE",
      description: "Updated invoice amount",
      previousState: { amount: 100, currency: "USD" },
      newState: { amount: 150, currency: "USD" },
      changes: { amount: { from: 100, to: 150 } },
    };

    const auditLog = await AuditRepository.createAuditLog(input);

    expect(auditLog.previousState).toEqual({ amount: 100, currency: "USD" });
    expect(auditLog.newState).toEqual({ amount: 150, currency: "USD" });
    expect(auditLog.changes).toEqual({ amount: { from: 100, to: 150 } });

    testLogger.info("Audit log with state changes created", { auditLogId: auditLog.id });
  });

  test("should create audit log with metadata", async () => {
    const input: Types.CreateAuditLogInput = {
      actorUserId: null,
      actorType: "SYSTEM",
      entityType: "PAYMENT",
      entityId: "00000000-0000-0000-0000-000000000003",
      action: "REFUND",
      description: "Automatic refund processed",
      ipAddress: IP_ADDRESS_1,
      userAgent: "Mozilla/5.0",
      metadata: {
        refundAmount: 50,
        currency: "USD",
        reason: "Duplicate payment",
      },
    };

    const auditLog = await AuditRepository.createAuditLog(input);

    expect(auditLog.actorType).toBe("SYSTEM");
    expect(auditLog.actorUserId).toBeNull();
    expect(auditLog.ipAddress).toBe(IP_ADDRESS_1);
    expect(auditLog.metadata).toEqual({
      refundAmount: 50,
      currency: "USD",
      reason: "Duplicate payment",
    });

    testLogger.info("Audit log with metadata created", { auditLogId: auditLog.id });
  });

  test("should query audit logs with filters", async () => {
    // Create multiple audit logs
    await AuditRepository.createAuditLog({
      actorUserId: testUser1.id,
      actorType: "USER",
      entityType: "STUDENT",
      entityId: "00000000-0000-0000-0000-000000000004",
      action: "UPDATE",
    });

    await AuditRepository.createAuditLog({
      actorUserId: testUser1.id,
      actorType: "USER",
      entityType: "STUDENT",
      entityId: "00000000-0000-0000-0000-000000000005",
      action: "DELETE",
    });

    // Query by actor
    const result = await AuditRepository.queryAuditLogs({
      actorUserId: testUser1.id,
      entityType: "STUDENT",
    });

    expect(result.logs.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
    testLogger.info("Query audit logs successful", { count: result.logs.length });
  });

  test("should get entity audit logs", async () => {
    const entityId = "00000000-0000-0000-0000-000000000006";

    // Create multiple logs for the same entity
    await AuditRepository.createAuditLog({
      actorUserId: testUser1.id,
      actorType: "USER",
      entityType: "INVOICE",
      entityId,
      action: "CREATE",
    });

    await AuditRepository.createAuditLog({
      actorUserId: testUser2.id,
      actorType: "USER",
      entityType: "INVOICE",
      entityId,
      action: "UPDATE",
    });

    const logs = await AuditRepository.getEntityAuditLogs("INVOICE", entityId);

    expect(logs.length).toBeGreaterThanOrEqual(2);
    expect(logs.every(log => log.entityId === entityId)).toBe(true);
    testLogger.info("Entity audit logs retrieved", { count: logs.length });
  });

  test("should get actor audit logs", async () => {
    const logs = await AuditRepository.getActorAuditLogs(testUser1.id);

    expect(logs.length).toBeGreaterThan(0);
    expect(logs.every(log => log.actorUserId === testUser1.id)).toBe(true);
    testLogger.info("Actor audit logs retrieved", { count: logs.length });
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
    const studentId = "00000000-0000-0000-0000-000000000007";

    const auditLog = await AuditRepository.logStudentStatusChange({
      studentId,
      oldStatus: "ACTIVE",
      newStatus: "INACTIVE",
      actorUserId: testUser1.id,
      description: "Student requested suspension",
    });

    expect(auditLog.entityType).toBe("STUDENT");
    expect(auditLog.action).toBe("STATUS_CHANGE");
    expect(auditLog.previousState).toEqual({ status: "ACTIVE" });
    expect(auditLog.newState).toEqual({ status: "INACTIVE" });
    testLogger.info("Student status change logged", { auditLogId: auditLog.id });
  });

  test("should log invoice change", async () => {
    const invoiceId = "00000000-0000-0000-0000-000000000008";

    const auditLog = await AuditRepository.logInvoiceChange({
      invoiceId,
      action: "UPDATE",
      previousState: { amount: 100, status: "PENDING" },
      newState: { amount: 100, status: "PAID" },
      actorUserId: testUser1.id,
      description: "Invoice payment confirmed",
    });

    expect(auditLog.entityType).toBe("INVOICE");
    expect(auditLog.action).toBe("UPDATE");
    expect(auditLog.changes).toBeDefined();
    testLogger.info("Invoice change logged", { auditLogId: auditLog.id });
  });

  test("should log payment refund", async () => {
    const paymentId = "00000000-0000-0000-0000-000000000009";

    const auditLog = await AuditRepository.logPaymentRefund({
      paymentId,
      refundAmount: 50.0,
      currency: "USD",
      actorUserId: testUser1.id,
      reason: "Customer requested refund",
    });

    expect(auditLog.entityType).toBe("PAYMENT");
    expect(auditLog.action).toBe("REFUND");
    expect(auditLog.metadata).toEqual({
      refundAmount: 50.0,
      currency: "USD",
      reason: "Customer requested refund",
    });
    testLogger.info("Payment refund logged", { auditLogId: auditLog.id });
  });

  test("should log permission change", async () => {
    const auditLog = await AuditRepository.logPermissionChange({
      userId: testUser2.id,
      action: "GRANT",
      permissionOrGroupId: "00000000-0000-0000-0000-00000000000a",
      permissionType: "PERMISSION_GROUP",
      actorUserId: testUser1.id,
      description: "Added admin role",
    });

    expect(auditLog.entityType).toBe("PERMISSION_GROUP");
    expect(auditLog.action).toBe("GRANT");
    expect(auditLog.metadata).toHaveProperty("targetUserId", testUser2.id);
    testLogger.info("Permission change logged", { auditLogId: auditLog.id });
  });

  test("should log exchange rate update", async () => {
    const rateId = "00000000-0000-0000-0000-00000000000b";

    const auditLog = await AuditRepository.logExchangeRateUpdate({
      rateId,
      fromCurrency: "USD",
      toCurrency: "EUR",
      oldRate: 0.85,
      newRate: 0.87,
      actorUserId: testUser1.id,
      source: "ECB",
    });

    expect(auditLog.entityType).toBe("EXCHANGE_RATE");
    expect(auditLog.action).toBe("UPDATE");
    expect(auditLog.previousState).toEqual({ rate: 0.85 });
    expect(auditLog.newState).toEqual({ rate: 0.87 });
    testLogger.info("Exchange rate update logged", { auditLogId: auditLog.id });
  });

  test("should log system setting change", async () => {
    const auditLog = await AuditRepository.logSystemSettingChange({
      settingKey: "max_students_per_teacher",
      oldValue: 10,
      newValue: 15,
      actorUserId: testUser1.id,
      description: "Increased capacity",
    });

    expect(auditLog.entityType).toBe("SYSTEM_SETTING");
    expect(auditLog.action).toBe("UPDATE");
    expect(auditLog.changes).toEqual({ value: { from: 10, to: 15 } });
    testLogger.info("System setting change logged", { auditLogId: auditLog.id });
  });

  test("should support transactional audit logging", async () => {
    await db.transaction(async tx => {
      const auditLog1 = await AuditRepository.createAuditLog(
        {
          actorUserId: testUser1.id,
          actorType: "USER",
          entityType: "STUDENT",
          entityId: "00000000-0000-0000-0000-00000000000c",
          action: "CREATE",
        },
        tx
      );

      const auditLog2 = await AuditRepository.createAuditLog(
        {
          actorUserId: testUser1.id,
          actorType: "USER",
          entityType: "STUDENT",
          entityId: "00000000-0000-0000-0000-00000000000c",
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
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats = await AuditRepository.getAuditStatistics(yesterday, now);

    expect(stats.length).toBeGreaterThan(0);
    expect(stats[0]).toHaveProperty("entityType");
    expect(stats[0]).toHaveProperty("action");
    expect(stats[0]).toHaveProperty("count");
    testLogger.info("Audit statistics retrieved", { statsCount: stats.length });
  });

  test("should prevent audit log updates (immutability)", async () => {
    await db.transaction(async (tx: DbTransaction) => {
      // Create an audit log
      const auditLog = await AuditRepository.createAuditLog(
        {
          actorUserId: testUser1.id,
          actorType: "USER",
          entityType: "STUDENT",
          entityId: "00000000-0000-0000-0000-00000000000d",
          action: "CREATE",
          description: "Original description",
        },
        tx
      );

      // Attempt to update should fail
      let updateThrew = false;
      try {
        await tx
          .update(auditLogs)
          .set({ description: "Modified description" })
          .where(sql`id = ${auditLog.id}`);
      } catch {
        // The trigger prevents the operation - any error means it worked
        // We just verify that an error was thrown, not the specific message
        updateThrew = true;
      }

      expect(updateThrew).toBe(true);
      testLogger.info("Audit log update prevented (immutability enforced)");
    });
  });

  test("should prevent audit log deletion (immutability)", async () => {
    await db.transaction(async (tx: DbTransaction) => {
      // Create an audit log
      const auditLog = await AuditRepository.createAuditLog(
        {
          actorUserId: testUser1.id,
          actorType: "USER",
          entityType: "STUDENT",
          entityId: "00000000-0000-0000-0000-00000000000e",
          action: "DELETE",
        },
        tx
      );

      // Attempt to delete should fail
      let deleteThrew = false;
      try {
        await tx.delete(auditLogs).where(sql`id = ${auditLog.id}`);
      } catch {
        // The trigger prevents the operation - any error means it worked
        // We just verify that an error was thrown, not the specific message
        deleteThrew = true;
      }

      expect(deleteThrew).toBe(true);
      testLogger.info("Audit log deletion prevented (immutability enforced)");
    });
  });

  test("should get recent audit logs", async () => {
    const recentLogs = await AuditRepository.getRecentAuditLogs(10);

    expect(recentLogs.length).toBeGreaterThan(0);
    expect(recentLogs.length).toBeLessThanOrEqual(10);

    // Check that logs are ordered by createdAt desc
    for (let i = 1; i < recentLogs.length; i++) {
      expect(recentLogs[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(recentLogs[i].createdAt.getTime());
    }

    testLogger.info("Recent audit logs retrieved", { count: recentLogs.length });
  });

  test("should handle pagination in queries", async () => {
    // Query first page
    const page1 = await AuditRepository.queryAuditLogs({
      limit: 5,
      offset: 0,
    });

    expect(page1.logs.length).toBeGreaterThan(0);
    expect(page1.total).toBeGreaterThan(0);

    // Query second page
    const page2 = await AuditRepository.queryAuditLogs({
      limit: 5,
      offset: 5,
    });

    // Ensure pages don't overlap
    if (page1.logs.length > 0 && page2.logs.length > 0) {
      expect(page1.logs[0].id).not.toBe(page2.logs[0].id);
    }

    testLogger.info("Pagination working correctly", {
      page1Count: page1.logs.length,
      page2Count: page2.logs.length,
    });
  });

  test("should filter by date range", async () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const result = await AuditRepository.queryAuditLogs({
      startDate: twoDaysAgo,
      endDate: now,
    });

    expect(result.logs.length).toBeGreaterThan(0);

    // All logs should be within the date range
    for (const log of result.logs) {
      expect(log.createdAt.getTime()).toBeGreaterThanOrEqual(twoDaysAgo.getTime());
      expect(log.createdAt.getTime()).toBeLessThanOrEqual(now.getTime());
    }

    testLogger.info("Date range filtering working", { count: result.logs.length });
  });

  test("should filter by multiple criteria", async () => {
    const entityId = "00000000-0000-0000-0000-00000000000f";

    // Create specific audit logs
    await AuditRepository.createAuditLog({
      actorUserId: testUser1.id,
      actorType: "USER",
      entityType: "INVOICE",
      entityId,
      action: "CREATE",
    });

    await AuditRepository.createAuditLog({
      actorUserId: testUser1.id,
      actorType: "USER",
      entityType: "INVOICE",
      entityId,
      action: "UPDATE",
    });

    // Query with multiple filters
    const result = await AuditRepository.queryAuditLogs({
      actorUserId: testUser1.id,
      entityType: "INVOICE",
      entityId,
      action: "UPDATE",
    });

    expect(result.logs.length).toBeGreaterThanOrEqual(1);
    expect(result.logs.every(log => log.actorUserId === testUser1.id)).toBe(true);
    expect(result.logs.every(log => log.entityType === "INVOICE")).toBe(true);
    expect(result.logs.every(log => log.action === "UPDATE")).toBe(true);

    testLogger.info("Multiple criteria filtering working", { count: result.logs.length });
  });
});
