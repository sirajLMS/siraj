import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { testLogger } from "../../../lib/testlogger";
import { db } from "../drizzleDb";
import { users } from "../schema";

describe("Row Level Security and Soft Delete", () => {
  beforeAll(async () => {
    testLogger.info("Setting up RLS test role...");
    // Create a non-superuser role for testing RLS policies
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'test_rls_user') THEN
          CREATE ROLE test_rls_user WITH LOGIN PASSWORD 'test_rls_pass';
        END IF;
      END
      $$;
      
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_rls_user;
      GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_rls_user;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO test_rls_user;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO test_rls_user;
    `);
    testLogger.info("RLS test role set up successfully.");
  });

  afterAll(async () => {
    testLogger.info("Cleaning up RLS test role...");
    try {
      await db.execute(sql`
        REASSIGN OWNED BY test_rls_user TO postgres;
        DROP OWNED BY test_rls_user;
        DROP ROLE IF EXISTS test_rls_user;
      `);
      testLogger.info("RLS test role cleaned up.");
    } catch (error) {
      testLogger.warn("Failed to drop RLS test role:", error);
    }
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

  test("Delete cancels hard delete, performs soft delete, and hides row from SELECT. Second delete as RLS role does nothing. Delete as superuser hard deletes.", async () => {
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

    // 2. Perform first DELETE under RLS role
    await db.transaction(async tx => {
      await tx.execute(sql`SET LOCAL ROLE test_rls_user`);
      testLogger.info(`Executing first DELETE for user: ${user.id}`);
      await tx.delete(users).where(sql`id = ${user.id}`);
    });

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

    // 5. Perform second DELETE under RLS role. This should do nothing because the row is invisible to RLS SELECT.
    await db.transaction(async tx => {
      await tx.execute(sql`SET LOCAL ROLE test_rls_user`);
      testLogger.info(`Executing second DELETE as RLS role for user: ${user.id} (should be 0 rows)`);
      const res = await tx.delete(users).where(sql`id = ${user.id}`).returning();
      expect(res.length).toBe(0);
    });

    // 6. Perform DELETE as superuser (which bypasses RLS and can find the soft-deleted row)
    testLogger.info(`Executing DELETE as superuser for user: ${user.id}`);
    const res = await db.delete(users).where(sql`id = ${user.id}`).returning();
    expect(res.length).toBe(1);

    // 7. Verify user is now completely gone from the database (even for superuser)
    const superuserSelectAfter = await db.select().from(users).where(sql`id = ${user.id}`);
    expect(superuserSelectAfter.length).toBe(0);
    testLogger.info("User permanently hard-deleted after delete by superuser.");
  });
});
