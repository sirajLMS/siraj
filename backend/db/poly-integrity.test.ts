import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { testLogger } from "../../lib/testlogger";
import type { UserEntity } from "../types";
import { db } from "./drizzleDb";
import { fileUsages, users } from "./schema";

describe("Polymorphic Foreign Key Integrity", () => {
  let testUser: UserEntity | null = null;

  beforeAll(async () => {
    testLogger.info("Setting up parent records for polymorphic FK tests...");
    // Create a test user as a valid reference parent
    const email = `poly-parent-${randomUUID()}@example.com`;
    const now = new Date();
    const [inserted] = await db
      .insert(users)
      .values({
        name: "Poly Parent User",
        email,
        password: "securePassword",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    testUser = inserted;
    testLogger.info(`Created test user: ${testUser.id}`);
  });

  afterAll(async () => {
    testLogger.info("Cleaning up polymorphic FK test records...");
    if (testUser) {
      // Clean up the user (should also trigger cascade delete on file_usage if any remain)
      await db.delete(users).where(sql`id = ${testUser.id}`);
      testLogger.info("Test user cleaned up.");
    }
  });

  test("Inserting file_usage with valid reference table and reference ID succeeds", async () => {
    if (!testUser) throw new Error("testUser is not initialized");
    const now = new Date();
    testLogger.info(`Inserting valid file_usage for user: ${testUser.id}`);

    const [usage] = await db
      .insert(fileUsages)
      .values({
        filePath: "/uploads/avatar-valid.png",
        usageType: "avatar",
        referenceId: testUser.id,
        referenceTable: "users",
        createdAt: now,
      })
      .returning();

    expect(usage).toBeDefined();
    expect(usage.referenceId).toBe(testUser.id);
    expect(usage.referenceTable).toBe("users");

    // Clean up
    await db.delete(fileUsages).where(sql`id = ${usage.id}`);
    testLogger.info("Valid file_usage test passed and cleaned up.");
  });

  test("Inserting file_usage with non-existent reference ID fails", async () => {
    const now = new Date();
    const fakeId = randomUUID();
    testLogger.info(`Attempting to insert file_usage with non-existent reference ID: ${fakeId}`);

    let error: unknown = null;
    try {
      await db.insert(fileUsages).values({
        filePath: "/uploads/avatar-invalid.png",
        usageType: "avatar",
        referenceId: fakeId,
        referenceTable: "users",
        createdAt: now,
      });
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    // Verify the error message matches the trigger validation failure
    const errMsg =
      (error as { message?: string; cause?: { message?: string } }).cause?.message || (error as Error).message || "";
    expect(errMsg).toContain("does not exist in table");
    testLogger.info("Insertion with non-existent reference ID failed as expected.");
  });

  test("Inserting file_usage with invalid reference table name fails", async () => {
    if (!testUser) throw new Error("testUser is not initialized");
    const now = new Date();
    testLogger.info("Attempting to insert file_usage with invalid reference table: non_existent_table");

    let error: unknown = null;
    try {
      await db.insert(fileUsages).values({
        filePath: "/uploads/avatar-invalid.png",
        usageType: "avatar",
        referenceId: testUser.id,
        referenceTable: "non_existent_table",
        createdAt: now,
      });
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    const errMsg =
      (error as { message?: string; cause?: { message?: string } }).cause?.message || (error as Error).message || "";
    expect(errMsg).toContain("Invalid reference table");
    testLogger.info("Insertion with invalid reference table failed as expected.");
  });

  test("Deleting parent row cascades and deletes associated file_usage records", async () => {
    const now = new Date();
    // 1. Create a temporary user to test cascade delete
    const email = `poly-cascade-${randomUUID()}@example.com`;
    const [tempUser] = await db
      .insert(users)
      .values({
        name: "Temp Cascade User",
        email,
        password: "securePassword",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    testLogger.info(`Created temp user for cascade delete: ${tempUser.id}`);

    // 2. Create multiple file usages pointing to the temp user
    const [usage1] = await db
      .insert(fileUsages)
      .values({
        filePath: "/uploads/avatar-temp.png",
        usageType: "avatar",
        referenceId: tempUser.id,
        referenceTable: "users",
        createdAt: now,
      })
      .returning();

    const [usage2] = await db
      .insert(fileUsages)
      .values({
        filePath: "/uploads/doc-temp.pdf",
        usageType: "document",
        referenceId: tempUser.id,
        referenceTable: "users",
        createdAt: now,
      })
      .returning();

    testLogger.info(`Created file usages: ${usage1.id}, ${usage2.id}`);

    // 3. Delete the temp user (first delete converts it to soft delete)
    testLogger.info(`Deleting temp user ${tempUser.id} (first delete - soft delete)...`);
    await db.delete(users).where(sql`id = ${tempUser.id}`);

    // Verify that the file usages still exist because the user is only soft-deleted (not hard-deleted)
    const afterSoft1 = await db
      .select()
      .from(fileUsages)
      .where(sql`id = ${usage1.id}`);
    expect(afterSoft1.length).toBe(1);

    // 4. Delete the temp user again (second delete performs hard delete)
    testLogger.info(`Deleting temp user ${tempUser.id} again (second delete - hard delete)...`);
    await db.delete(users).where(sql`id = ${tempUser.id}`);

    // 5. Verify that the file usages are now gone (cascade delete triggered)
    const remaining1 = await db
      .select()
      .from(fileUsages)
      .where(sql`id = ${usage1.id}`);
    const remaining2 = await db
      .select()
      .from(fileUsages)
      .where(sql`id = ${usage2.id}`);

    expect(remaining1.length).toBe(0);
    expect(remaining2.length).toBe(0);
    testLogger.info("Polymorphic cascade delete verified successfully upon hard delete.");
  });
});
