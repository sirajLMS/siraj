import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { parents, students, users } from "@/backend/db/schema";
import {
  generateTestPassword,
  runInRollback,
  setupRlsPolicies,
  setupRlsRole,
  teardownRlsRole,
} from "@/backend/db/test/test-utils";
import type { DBTransaction } from "@/backend/types";
import { testLogger } from "@/shared/lib/logger/testlogger";

function setLocalUserId(tx: DBTransaction, userId: string) {
  const quotedUserId = `'${userId}'`;
  return tx.execute(sql`SET LOCAL app.current_user_id = ${sql.raw(quotedUserId)}`);
}

/**
 * Helper to create a user with a given name and unique email
 */
async function createNamedUser(tx: DBTransaction, name: string, now: Date) {
  const email = `${name.toLowerCase().replace(/\s+/g, "-")}-${randomUUID()}@example.com`;
  const user = (
    await tx
      .insert(users)
      .values({ name, email, password: generateTestPassword(), createdAt: now, updatedAt: now })
      .returning()
  )[0];
  return user;
}

/**
 * Helper to create a parent linked to a given user
 */
async function createParentForUser(tx: DBTransaction, userId: string, now: Date) {
  const [parent] = await tx
    .insert(parents)
    .values({ userId, status: "REGULAR", createdAt: now, updatedAt: now })
    .returning();
  return parent;
}

/**
 * Helper to create a student for a given parent
 */
async function createStudentForParent(tx: DBTransaction, parentId: string, name: string, now: Date) {
  const studentUser = await createNamedUser(tx, `${name} User`, now);
  const [student] = await tx
    .insert(students)
    .values({
      parentId,
      userId: studentUser.id,
      name,
      status: "REGULAR",
      idempotencyKey: randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return student;
}

/**
 * Helper to setup common test data for RLS tests
 */
async function setupTestData(tx: DBTransaction) {
  const now = new Date();

  const parentAUser = await createNamedUser(tx, "Parent A", now);
  const parentA = await createParentForUser(tx, parentAUser.id, now);

  const parentBUser = await createNamedUser(tx, "Parent B", now);
  const parentB = await createParentForUser(tx, parentBUser.id, now);

  const studentA = await createStudentForParent(tx, parentA.id, "Student A", now);
  const studentB = await createStudentForParent(tx, parentB.id, "Student B", now);

  return { parentAUser, parentBUser, studentA, studentB };
}

describe("Row Level Security for Students", () => {
  beforeAll(async () => {
    await setupRlsRole();
    await setupRlsPolicies([
      { table: "users", name: "users_select_policy", definition: "FOR SELECT USING (deleted_at IS NULL)" },
      { table: "users", name: "users_insert_policy", definition: "FOR INSERT WITH CHECK (deleted_at IS NULL)" },
      {
        table: "students",
        name: "students_select_policy",
        definition:
          "FOR SELECT USING (NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()) OR parent_id = (SELECT id FROM parents WHERE user_id = current_user_id()))",
      },
      {
        table: "students",
        name: "students_insert_policy",
        definition:
          "FOR INSERT WITH CHECK (NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()) OR parent_id = (SELECT id FROM parents WHERE user_id = current_user_id()))",
      },
      {
        table: "students",
        name: "students_update_policy",
        definition:
          "FOR UPDATE USING (NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()) OR parent_id = (SELECT id FROM parents WHERE user_id = current_user_id())) WITH CHECK (NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()) OR parent_id = (SELECT id FROM parents WHERE user_id = current_user_id()))",
      },
      {
        table: "students",
        name: "students_delete_policy",
        definition:
          "FOR DELETE USING (NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()) OR parent_id = (SELECT id FROM parents WHERE user_id = current_user_id()))",
      },
    ]);
  });

  afterAll(async () => {
    await teardownRlsRole();
  });

  test("Allows parents to see only their own students", async () => {
    testLogger.info("Testing parents selecting own students under RLS...");

    await runInRollback(async tx => {
      const { parentAUser, parentBUser, studentA, studentB } = await setupTestData(tx);

      const studentIds = sql`id IN (${studentA.id}, ${studentB.id})`;

      await tx.execute(sql`SET LOCAL ROLE test_rls_user`);

      await setLocalUserId(tx, parentAUser.id);
      const parentAView = await tx.select().from(students).where(studentIds);

      expect(parentAView).toHaveLength(1);
      expect(parentAView[0]?.id).toBe(studentA.id);

      await setLocalUserId(tx, parentBUser.id);
      const parentBView = await tx.select().from(students).where(studentIds);

      expect(parentBView).toHaveLength(1);
      expect(parentBView[0]?.id).toBe(studentB.id);
    });

    testLogger.info("Parent SELECT RLS test passed.");
  });

  test("Allows parents to update or delete only their own students", async () => {
    testLogger.info("Testing parents updating/deleting own students under RLS...");

    await runInRollback(async tx => {
      const { parentAUser, studentA, studentB } = await setupTestData(tx);

      await tx.execute(sql`SET LOCAL ROLE test_rls_user`);
      await setLocalUserId(tx, parentAUser.id);

      const updateResult = await tx
        .update(students)
        .set({ name: "Updated Student A" })
        .where(eq(students.id, studentA.id))
        .returning();
      expect(updateResult).toHaveLength(1);

      const updateBResult = await tx
        .update(students)
        .set({ name: "Malicious Update" })
        .where(eq(students.id, studentB.id))
        .returning();
      expect(updateBResult).toHaveLength(0);

      const deleteBResult = await tx.delete(students).where(eq(students.id, studentB.id)).returning();
      expect(deleteBResult).toHaveLength(0);

      const deleteResult = await tx.delete(students).where(eq(students.id, studentA.id)).returning();
      expect(deleteResult).toHaveLength(1);
    });

    testLogger.info("Parent UPDATE/DELETE RLS test passed.");
  });

  test("Allows administrators to view all students", async () => {
    testLogger.info("Testing administrators selecting all students under RLS...");

    await runInRollback(async tx => {
      const { studentA, studentB } = await setupTestData(tx);

      await tx.execute(sql`SET LOCAL ROLE test_rls_user`);

      const adminUserId = randomUUID();
      await setLocalUserId(tx, adminUserId);

      const adminView = await tx.select().from(students).where(sql`id IN (${studentA.id}, ${studentB.id})`);

      expect(adminView).toHaveLength(2);
    });

    testLogger.info("Admin SELECT RLS test passed.");
  });
});
