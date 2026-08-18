import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db";
import { SoftDeleteRepository } from "@/backend/db/repo/shared";
import { StorageDbRepository } from "@/backend/db/repo/storage";
import { storageFiles, userFiles, users } from "@/backend/db/schema";
import { createTestUser } from "@/backend/db/test/entity-setup";
import type { UserSelectType } from "@/backend/types";
import { testLogger } from "@/shared/lib/logger/testlogger";

describe("Consolidated File Usage Integrity (Junction Tables)", () => {
  let testUser: UserSelectType | null = null;
  const testPath = `/uploads/test-file-${randomUUID()}.png`;

  beforeAll(async () => {
    testLogger.info("Setting up parent records for file usage tests...");
    // StorageDbRepository methods use the global `db` connection and do not
    // accept a `tx` parameter, so these records are created outside runInRollback.
    // afterAll cleanup ensures no leakage (AGENTS.md rule 9 exception).
    testUser = await db.transaction(async tx =>
      createTestUser(tx, {
        name: "Poly Parent User",
        email: `poly-parent-${randomUUID()}@example.com`,
      })
    );
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
    expect(usages).toHaveLength(1);
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
    // StorageDbRepository methods use global db (not tx), so this test cannot
    // use runInRollback for the storage operations. Manual cleanup handles it.
    const tempUser = await createTestUser(db, {
      name: "Temp Cascade User",
      email: `poly-cascade-${randomUUID()}@example.com`,
    });

    // Register usage via repository (uses global db)
    const cascadePath = `/uploads/cascade-${randomUUID()}.png`;
    await StorageDbRepository.registerFileUsage({
      filePath: cascadePath,
      usageType: "avatar",
      referenceId: tempUser.id,
      referenceTable: "users",
    });

    // 2. Verify usage exists
    let isInUse = await StorageDbRepository.isFileInUse(cascadePath);
    expect(isInUse).toBe(true);

    // 3. Soft delete the temp user via repository
    await SoftDeleteRepository.softDeleteUser(tempUser.id);

    // Usage should still exist after soft delete (user record still there)
    isInUse = await StorageDbRepository.isFileInUse(cascadePath);
    expect(isInUse).toBe(true);

    // 4. Hard delete
    await SoftDeleteRepository.hardDelete("users", tempUser.id);

    // 5. Verify the junction record is now gone (native cascade delete)
    isInUse = await StorageDbRepository.isFileInUse(cascadePath);
    expect(isInUse).toBe(false);

    // Clean up storage file
    await db.delete(storageFiles).where(eq(storageFiles.path, cascadePath));

    testLogger.info("Cascade delete verified successfully.");
  });
});
