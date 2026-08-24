import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { isSqlite } from "@/backend/db";
import { SoftDeleteRepository } from "@/backend/db/repo/shared";
import { users } from "@/backend/db/schema";
import {
  generateTestPassword,
  runInRollback,
  setupRlsPolicies,
  setupRlsRole,
  teardownRlsRole,
} from "@/backend/db/test/test-utils";

describe.skipIf(isSqlite())("Row Level Security and Soft Delete", () => {
  beforeAll(async () => {
    await setupRlsRole();
    await setupRlsPolicies([
      { table: "users", name: "users_select_policy", definition: "FOR SELECT USING (deleted_at IS NULL)" },
      { table: "users", name: "users_insert_policy", definition: "FOR INSERT WITH CHECK (deleted_at IS NULL)" },
      {
        table: "users",
        name: "users_update_policy",
        definition:
          "FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true'))",
      },
      { table: "users", name: "users_delete_policy", definition: "FOR DELETE USING (false)" },
    ]);
  });

  afterAll(async () => {
    await teardownRlsRole();
  });

  test("Insert with deleted_at IS NULL succeeds, but deleted_at IS NOT NULL fails under RLS", async () => {
    await runInRollback(async tx => {
      const emailValid = `rls-test-${randomUUID()}@example.com`;
      const emailInvalid = `rls-test-${randomUUID()}@example.com`;
      const now = new Date();
      const passwordHash = generateTestPassword();

      await tx.execute(sql`SET LOCAL ROLE test_rls_user`);
      await tx.execute(sql`SET LOCAL app.current_user_id = '00000000-0000-0000-0000-000000000000'`);

      const validRows = await tx
        .insert(users)
        .values({
          name: "RLS Test User",
          email: emailValid,
          password: passwordHash,
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: users.id });
      expect(validRows).toHaveLength(1);

      let insertError: unknown = null;
      try {
        await tx
          .insert(users)
          .values({
            name: "RLS Deleted User",
            email: emailInvalid,
            password: passwordHash,
            createdAt: now,
            updatedAt: now,
            deletedAt: now,
          })
          .returning({ id: users.id });
      } catch (e) {
        insertError = e;
      }

      expect(insertError).not.toBeNull();
    });
  });

  test("Update to deleted_at IS NOT NULL fails under RLS", async () => {
    await runInRollback(async tx => {
      const email = `rls-update-${randomUUID()}@example.com`;
      const now = new Date();

      const [user] = await tx
        .insert(users)
        .values({
          name: "RLS Update User",
          email,
          password: generateTestPassword(),
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      await tx.execute(sql`SET LOCAL ROLE test_rls_user`);
      await tx.execute(sql`SET LOCAL app.current_user_id = '00000000-0000-0000-0000-000000000000'`);

      let updateError: unknown = null;
      let updatedRows: { id: string }[] = [];
      try {
        updatedRows = await tx
          .update(users)
          .set({ deletedAt: now })
          .where(eq(users.id, user.id))
          .returning({ id: users.id });
      } catch (e) {
        updateError = e;
      }

      expect(updateError !== null || updatedRows.length === 0).toBe(true);
    });
  });

  test("Repository soft delete hides row from SELECT. Hard delete as RLS role is blocked. Superuser hard delete removes row.", async () => {
    await runInRollback(async tx => {
      const email = `rls-delete-${randomUUID()}@example.com`;
      const now = new Date();

      const [user] = await tx
        .insert(users)
        .values({
          name: "RLS Delete User",
          email,
          password: generateTestPassword(),
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      await SoftDeleteRepository.softDeleteUser(user.id, null, tx);

      await tx.execute(sql`SET LOCAL ROLE test_rls_user`);
      await tx.execute(sql`SET LOCAL app.current_user_id = '00000000-0000-0000-0000-000000000000'`);

      const selectedUsers = await tx.select({ id: users.id }).from(users).where(eq(users.id, user.id));
      expect(selectedUsers).toHaveLength(0);

      let deleteResult: { id: string }[] = [];
      try {
        deleteResult = await tx.delete(users).where(eq(users.id, user.id)).returning({ id: users.id });
      } catch {
        // Blocked by RLS delete policy
      }
      expect(deleteResult).toHaveLength(0);

      await tx.execute(sql`RESET ROLE`);

      const [superuserSelect] = await tx.select().from(users).where(eq(users.id, user.id));
      expect(superuserSelect).toBeDefined();
      expect(superuserSelect.deletedAt).not.toBeNull();

      const deleteRes = await SoftDeleteRepository.hardDelete("users", user.id, tx);
      expect(deleteRes.id).toBe(user.id);

      const superuserSelectAfter = await tx.select().from(users).where(eq(users.id, user.id));
      expect(superuserSelectAfter).toHaveLength(0);
    });
  });
});
