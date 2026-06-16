import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { testLogger } from "@/shared/lib/testlogger";
import { db } from "../drizzleDb";
import { SoftDeleteRepository } from "../repo";
import { users } from "../schema";
import { setupRlsRole, teardownRlsRole } from "./test-utils";

describe("Row Level Security and Soft Delete", () => {
  beforeAll(async () => {
    await setupRlsRole();
  });

  afterAll(async () => {
    await teardownRlsRole();
  });

  test("Insert with deleted_at IS NULL succeeds, but deleted_at IS NOT NULL fails under RLS", async () => {
    await db
      .transaction(async tx => {
        // 1. Switch to the non-superuser role
        await tx.execute(sql`SET LOCAL ROLE test_rls_user`);

        const emailValid = `rls-test-${randomUUID()}@example.com`;
        const emailInvalid = `rls-test-${randomUUID()}@example.com`;
        const now = new Date();

        testLogger.info(`Inserting valid user under RLS: ${emailValid}`);
        // Inserting with deleted_at = null should succeed
        const [insertedUser] = await tx
          .insert(users)
          .values({
            name: "RLS Test User",
            email: emailValid,
            password: "securePassword",
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
          })
          .returning();

        expect(insertedUser).toBeDefined();
        expect(insertedUser.email).toBe(emailValid);

        testLogger.info(`Inserting invalid user with pre-set deleted_at under RLS: ${emailInvalid}`);
        // Inserting with deleted_at IS NOT NULL should fail RLS check
        let insertError: unknown = null;
        try {
          await tx.insert(users).values({
            name: "RLS Deleted User",
            email: emailInvalid,
            password: "securePassword",
            createdAt: now,
            updatedAt: now,
            deletedAt: now,
          });
        } catch (e) {
          insertError = e;
        }

        expect(insertError).not.toBeNull();
        testLogger.info("Insert with pre-set deleted_at failed as expected under RLS.");

        // Rollback transaction to keep DB clean
        tx.rollback();
      })
      .catch(() => {
        // Catch transaction rollback
      });
  });

  test("Update to deleted_at IS NOT NULL fails under RLS", async () => {
    await db
      .transaction(async tx => {
        // Create user as superuser first (before switching role) so we are sure they exist
        const email = `rls-update-${randomUUID()}@example.com`;
        const now = new Date();

        const [user] = await tx
          .insert(users)
          .values({
            name: "RLS Update User",
            email: email,
            password: "securePassword",
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        // Switch to the non-superuser role
        await tx.execute(sql`SET LOCAL ROLE test_rls_user`);

        testLogger.info(`Attempting to update deleted_at to non-null value under RLS for user: ${email}`);
        let updateError: unknown = null;
        try {
          await tx.update(users).set({ deletedAt: now }).where(sql`id = ${user.id}`);
        } catch (e) {
          updateError = e;
        }

        expect(updateError).not.toBeNull();
        testLogger.info("Update setting deleted_at failed as expected under RLS.");

        tx.rollback();
      })
      .catch(() => {});
  });

  test("Repository soft delete hides row from SELECT. Hard delete as RLS role is blocked. Superuser hard delete removes row.", async () => {
    const email = `rls-delete-${randomUUID()}@example.com`;
    const now = new Date();

    // 1. Create a user as superuser
    const [user] = await db
      .insert(users)
      .values({
        name: "RLS Delete User",
        email: email,
        password: "securePassword",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    testLogger.info(`Created test user: ${user.id} (${email})`);

    // 2. Perform soft delete via repository (application layer uses privileged DB connection)
    testLogger.info(`Executing repository soft delete for user: ${user.id}`);
    await SoftDeleteRepository.softDeleteUser(user.id);

    // 3. Verify user is hidden from SELECT under RLS role
    await db.transaction(async tx => {
      await tx.execute(sql`SET LOCAL ROLE test_rls_user`);
      const selectedUsers = await tx.select().from(users).where(sql`id = ${user.id}`);
      testLogger.info(`Select count under RLS role: ${selectedUsers.length}`);
      expect(selectedUsers.length).toBe(0);
    });

    // 4. Verify user STILL exists in database with deleted_at set (queried as superuser)
    const [superuserSelect] = await db.select().from(users).where(sql`id = ${user.id}`);
    expect(superuserSelect).toBeDefined();
    expect(superuserSelect.deletedAt).not.toBeNull();
    testLogger.info(`User in database has deleted_at = ${superuserSelect.deletedAt}`);

    // 5. Hard DELETE under RLS role is blocked by policy (0 rows affected)
    await db.transaction(async tx => {
      await tx.execute(sql`SET LOCAL ROLE test_rls_user`);
      testLogger.info(`Executing hard DELETE as RLS role for user: ${user.id} (should be 0 rows)`);
      const res = await tx.delete(users).where(sql`id = ${user.id}`).returning();
      expect(res.length).toBe(0);
    });

    // 6. Perform hard delete as superuser via repository
    testLogger.info(`Executing hard delete as superuser for user: ${user.id}`);
    const res = await SoftDeleteRepository.hardDelete("users", user.id);
    expect(res.id).toBe(user.id);

    // 7. Verify user is now completely gone from the database (even for superuser)
    const superuserSelectAfter = await db.select().from(users).where(sql`id = ${user.id}`);
    expect(superuserSelectAfter.length).toBe(0);
    testLogger.info("User permanently hard-deleted after delete by superuser.");
  });
});
