import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { testLogger } from "../../../lib/testlogger";
import type { UserEntity } from "../../types";
import { db } from "../drizzleDb";
import { StorageDbRepository } from "../repo";
import { storageFiles, userFiles, users } from "../schema";

describe("Consolidated File Usage Integrity (Junction Tables)", () => {
  let testUser: UserEntity | null = null;
  const testPath = `/uploads/test-file-${randomUUID()}.png`;

  beforeAll(async () => {
    testLogger.info("Setting up parent records for file usage tests...");
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
    testLogger.info("Cleaning up file usage test records...");
    if (testUser) {
      await db.delete(users).where(eq(users.id, testUser.id));
    }
    await db.delete(storageFiles).where(eq(storageFiles.path, testPath));
  });

  test("Registering file usage through repository creates junction record", async () => {
    if (!testUser) throw new Error("testUser is not initialized");

    testLogger.info(`Registering usage for user: ${testUser.id}`);

    const result = await StorageDbRepository.registerFileUsage({
      filePath: testPath,
      usageType: "avatar",
      referenceId: testUser.id,
      referenceTable: "users",
    });

    expect(result.success).toBe(true);

    // Verify junction record exists
    const [usage] = await db.select().from(userFiles).where(eq(userFiles.userId, testUser.id));
    expect(usage).toBeDefined();

    // Verify storage_file entry was created
    const file = await StorageDbRepository.fileByPath(testPath);
    expect(file).toBeDefined();
    if (file) {
      expect(usage.fileId).toBe(file.id);
    }

    testLogger.info("Register usage test passed.");
  });

  test("isFileInUse correctly identifies usage across junction tables", async () => {
    const isInUse = await StorageDbRepository.isFileInUse(testPath);
    expect(isInUse).toBe(true);

    const usages = await StorageDbRepository.getFileUsages(testPath);
    expect(usages.length).toBe(1);
    expect(usages[0].referenceTable).toBe("users");
    if (testUser) {
      expect(usages[0].referenceId).toBe(testUser.id);
    }

    testLogger.info("isFileInUse and getFileUsages tests passed.");
  });

  test("Unregistering file usage removes junction record", async () => {
    if (!testUser) throw new Error("testUser is not initialized");

    const success = await StorageDbRepository.unregisterFileUsage(testPath, "avatar", testUser.id);
    expect(success).toBe(true);

    const isInUse = await StorageDbRepository.isFileInUse(testPath);
    expect(isInUse).toBe(false);

    testLogger.info("Unregister usage test passed.");
  });

  test("Deleting parent row cascades and deletes associated junction records", async () => {
    // 1. Create a temporary user
    const email = `poly-cascade-${randomUUID()}@example.com`;
    const now = new Date();
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

    // 2. Register usage
    const cascadePath = `/uploads/cascade-${randomUUID()}.png`;
    await StorageDbRepository.registerFileUsage({
      filePath: cascadePath,
      usageType: "avatar",
      referenceId: tempUser.id,
      referenceTable: "users",
    });

    // 3. Verify usage exists
    let isInUse = await StorageDbRepository.isFileInUse(cascadePath);
    expect(isInUse).toBe(true);

    // 4. Hard delete the temp user (note: first delete is soft delete in our system)
    await db.delete(users).where(eq(users.id, tempUser.id)); // Soft delete

    // Usage should still exist after soft delete (as user record is still there)
    isInUse = await StorageDbRepository.isFileInUse(cascadePath);
    expect(isInUse).toBe(true);

    // Hard delete
    await db.delete(users).where(eq(users.id, tempUser.id));

    // 5. Verify that the junction record is now gone (native cascade delete)
    isInUse = await StorageDbRepository.isFileInUse(cascadePath);
    expect(isInUse).toBe(false);

    // Cleanup storage_file
    await db.delete(storageFiles).where(eq(storageFiles.path, cascadePath));

    testLogger.info("Cascade delete verified successfully.");
  });
});
