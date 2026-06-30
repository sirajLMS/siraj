import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "../../drizzleDb";
import { SoftDeleteRepository } from "../../repo";
import { users } from "../../schema";
import { closeRlsClients, queryAsRlsRole, setupRlsRole, teardownRlsRole } from "../test-utils";

describe("Row Level Security and Soft Delete", () => {
  beforeAll(async () => {
    await setupRlsRole();
  });

  afterAll(async () => {
    await closeRlsClients();
    await teardownRlsRole();
  });

  test("Insert with deleted_at IS NULL succeeds, but deleted_at IS NOT NULL fails under RLS", async () => {
    const emailValid = `rls-test-${randomUUID()}@example.com`;
    const emailInvalid = `rls-test-${randomUUID()}@example.com`;
    const now = new Date();

    const validRows = await queryAsRlsRole<{ id: string }>(
      "test_rls_user",
      "00000000-0000-0000-0000-000000000000",
      `INSERT INTO "users" (name, email, password, created_at, updated_at) VALUES ('RLS Test User', $1, 'securePassword', $2, $2) RETURNING id`,
      [emailValid, now.toISOString()]
    );
    expect(validRows.length).toBe(1);

    let insertError: unknown = null;
    try {
      await queryAsRlsRole(
        "test_rls_user",
        "00000000-0000-0000-0000-000000000000",
        `INSERT INTO "users" (name, email, password, created_at, updated_at, deleted_at) VALUES ('RLS Deleted User', $1, 'securePassword', $2, $2, $2)`,
        [emailInvalid, now.toISOString()]
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
      await queryAsRlsRole(
        "test_rls_user",
        "00000000-0000-0000-0000-000000000000",
        `UPDATE "users" SET deleted_at = $1 WHERE id = $2`,
        [now.toISOString(), user.id]
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

    const selectedUsers = await queryAsRlsRole<{ id: string }>(
      "test_rls_user",
      "00000000-0000-0000-0000-000000000000",
      `SELECT id FROM "users" WHERE id = $1`,
      [user.id]
    );
    expect(selectedUsers.length).toBe(0);

    const [superuserSelect] = await db.select().from(users).where(sql`id = ${user.id}`);
    expect(superuserSelect).toBeDefined();
    expect(superuserSelect.deletedAt).not.toBeNull();

    const deleteResult = await queryAsRlsRole<{ id: string }>(
      "test_rls_user",
      "00000000-0000-0000-0000-000000000000",
      `DELETE FROM "users" WHERE id = $1 RETURNING id`,
      [user.id]
    );
    expect(deleteResult.length).toBe(0);

    const deleteRes = await SoftDeleteRepository.hardDelete("users", user.id);
    expect(deleteRes.id).toBe(user.id);

    const superuserSelectAfter = await db.select().from(users).where(sql`id = ${user.id}`);
    expect(superuserSelectAfter.length).toBe(0);
  });
});
