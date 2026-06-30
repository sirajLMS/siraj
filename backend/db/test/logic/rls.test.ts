import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "../../drizzleDb";
import { SoftDeleteRepository } from "../../repo";
import { users } from "../../schema";
import { setupRlsPolicies, setupRlsRole, teardownRlsRole } from "../test-utils";

async function rlsQuery<T>(roleName: string, userId: string, querySql: string): Promise<T[]> {
  return db.transaction(async tx => {
    const quotedRole = `"${roleName}"`;
    await tx.execute(sql`SET LOCAL ROLE ${sql.raw(quotedRole)}`);
    await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
    const result = await tx.execute(sql.raw(querySql));
    return result.rows as T[];
  });
}

describe("Row Level Security and Soft Delete", () => {
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
    const emailValid = `rls-test-${randomUUID()}@example.com`;
    const emailInvalid = `rls-test-${randomUUID()}@example.com`;
    const now = new Date();

    const validRows = await rlsQuery<{ id: string }>(
      "test_rls_user",
      "00000000-0000-0000-0000-000000000000",
      `INSERT INTO "users" (name, email, password, created_at, updated_at) VALUES ('RLS Test User', '${emailValid}', 'securePassword', '${now.toISOString()}', '${now.toISOString()}') RETURNING id`
    );
    expect(validRows.length).toBe(1);

    let insertError: unknown = null;
    try {
      await rlsQuery(
        "test_rls_user",
        "00000000-0000-0000-0000-000000000000",
        `INSERT INTO "users" (name, email, password, created_at, updated_at, deleted_at) VALUES ('RLS Deleted User', '${emailInvalid}', 'securePassword', '${now.toISOString()}', '${now.toISOString()}', '${now.toISOString()}')`
      );
    } catch (e) {
      insertError = e;
    }

    expect(insertError).not.toBeNull();

    await db.delete(users).where(sql`email IN (${emailValid}, ${emailInvalid})`);
  });

  test("Update to deleted_at IS NOT NULL fails under RLS", async () => {
    const email = `rls-update-${randomUUID()}@example.com`;
    const now = new Date();

    const [user] = await db
      .insert(users)
      .values({
        name: "RLS Update User",
        email,
        password: "securePassword",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    let updateError: unknown = null;
    try {
      await rlsQuery(
        "test_rls_user",
        "00000000-0000-0000-0000-000000000000",
        `UPDATE "users" SET deleted_at = '${now.toISOString()}' WHERE id = '${user.id}'`
      );
    } catch (e) {
      updateError = e;
    }

    expect(updateError).not.toBeNull();

    await db.delete(users).where(sql`id = ${user.id}`);
  });

  test("Repository soft delete hides row from SELECT. Hard delete as RLS role is blocked. Superuser hard delete removes row.", async () => {
    const email = `rls-delete-${randomUUID()}@example.com`;
    const now = new Date();

    const [user] = await db
      .insert(users)
      .values({
        name: "RLS Delete User",
        email,
        password: "securePassword",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await SoftDeleteRepository.softDeleteUser(user.id);

    const selectedUsers = await rlsQuery<{ id: string }>(
      "test_rls_user",
      "00000000-0000-0000-0000-000000000000",
      `SELECT id FROM "users" WHERE id = '${user.id}'`
    );
    expect(selectedUsers.length).toBe(0);

    const [superuserSelect] = await db.select().from(users).where(sql`id = ${user.id}`);
    expect(superuserSelect).toBeDefined();
    expect(superuserSelect.deletedAt).not.toBeNull();

    const deleteResult = await rlsQuery<{ id: string }>(
      "test_rls_user",
      "00000000-0000-0000-0000-000000000000",
      `DELETE FROM "users" WHERE id = '${user.id}' RETURNING id`
    );
    expect(deleteResult.length).toBe(0);

    const deleteRes = await SoftDeleteRepository.hardDelete("users", user.id);
    expect(deleteRes.id).toBe(user.id);

    const superuserSelectAfter = await db.select().from(users).where(sql`id = ${user.id}`);
    expect(superuserSelectAfter.length).toBe(0);
  });
});
