import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/backend/db";
import { SoftDeleteRepository } from "@/backend/db/repo/shared";
import { users } from "@/backend/db/schema";
import {
  closeRlsClients,
  queryAsRlsRole,
  setupRlsPolicies,
  setupRlsRole,
  teardownRlsRole,
} from "@/backend/db/test/test-utils";

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
    await closeRlsClients();
    await teardownRlsRole();
  });

  test("Insert with deleted_at IS NULL succeeds, but deleted_at IS NOT NULL fails under RLS", async () => {
    const emailValid = `rls-test-${randomUUID()}@example.com`;
    const emailInvalid = `rls-test-${randomUUID()}@example.com`;
    const now = new Date();

    const passwordHash = randomUUID();
    const validRows = await queryAsRlsRole<{ id: string }>(
      "test_rls_user",
      "00000000-0000-0000-0000-000000000000",
      `INSERT INTO "users" (name, email, password, created_at, updated_at) VALUES ('RLS Test User', $1, $3, $2, $2) RETURNING id`,
      [emailValid, now.toISOString(), passwordHash]
    );
    expect(validRows).toHaveLength(1);

    let insertError: unknown = null;
    try {
      await queryAsRlsRole(
        "test_rls_user",
        "00000000-0000-0000-0000-000000000000",
        `INSERT INTO "users" (name, email, password, created_at, updated_at, deleted_at) VALUES ('RLS Deleted User', $1, $3, $2, $2, $2)`,
        [emailInvalid, now.toISOString(), passwordHash]
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
        password: randomUUID(),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    let updateError: unknown = null;
    let updatedRows: { id: string }[] = [];
    try {
      updatedRows = await queryAsRlsRole<{ id: string }>(
        "test_rls_user",
        "00000000-0000-0000-0000-000000000000",
        `UPDATE "users" SET deleted_at = $1 WHERE id = $2 RETURNING id`,
        [now.toISOString(), user.id]
      );
    } catch (e) {
      updateError = e;
    }

    const [activeRow] = await db.select().from(users).where(sql`id = ${user.id}`);
    expect(activeRow?.deletedAt).toBeNull();
    expect(updateError !== null || updatedRows.length === 0).toBe(true);

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
        password: randomUUID(),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await SoftDeleteRepository.softDeleteUser(user.id);

    const selectedUsers = await queryAsRlsRole<{ id: string }>(
      "test_rls_user",
      "00000000-0000-0000-0000-000000000000",
      `SELECT id FROM "users" WHERE id = $1`,
      [user.id]
    );
    expect(selectedUsers).toHaveLength(0);

    const [superuserSelect] = await db.select().from(users).where(sql`id = ${user.id}`);
    expect(superuserSelect).toBeDefined();
    expect(superuserSelect.deletedAt).not.toBeNull();

    const deleteResult = await queryAsRlsRole<{ id: string }>(
      "test_rls_user",
      "00000000-0000-0000-0000-000000000000",
      `DELETE FROM "users" WHERE id = $1 RETURNING id`,
      [user.id]
    );
    expect(deleteResult).toHaveLength(0);

    const deleteRes = await SoftDeleteRepository.hardDelete("users", user.id);
    expect(deleteRes.id).toBe(user.id);

    const superuserSelectAfter = await db.select().from(users).where(sql`id = ${user.id}`);
    expect(superuserSelectAfter).toHaveLength(0);
  });
});
