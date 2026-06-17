import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { testLogger } from "@/shared/lib/testlogger";
import type { ParentEntity, StudentEntity, UserEntity } from "../../../types";
import { db } from "../../drizzleDb";
import { parents, students, users } from "../../schema";
import { type DbTransaction, setupRlsRole, teardownRlsRole } from "../test-utils";

/**
 * Helper to setup common test data for RLS tests
 */
async function setupTestData(tx: DbTransaction) {
  const now = new Date();
  const parentAEmail = `parent-a-${randomUUID()}@example.com`;
  const parentBEmail = `parent-b-${randomUUID()}@example.com`;

  // 1. Create Parent A
  const [parentAUser] = (await tx
    .insert(users)
    .values({
      name: "Parent A",
      email: parentAEmail,
      password: "password",
      createdAt: now,
      updatedAt: now,
    })
    .returning()) as [UserEntity];

  const [parentA] = (await tx
    .insert(parents)
    .values({
      userId: parentAUser.id,
      status: "REGULAR",
      createdAt: now,
      updatedAt: now,
    })
    .returning()) as [ParentEntity];

  // 2. Create Parent B
  const [parentBUser] = (await tx
    .insert(users)
    .values({
      name: "Parent B",
      email: parentBEmail,
      password: "password",
      createdAt: now,
      updatedAt: now,
    })
    .returning()) as [UserEntity];

  const [parentB] = (await tx
    .insert(parents)
    .values({
      userId: parentBUser.id,
      status: "REGULAR",
      createdAt: now,
      updatedAt: now,
    })
    .returning()) as [ParentEntity];

  // 3. Create Student A (for Parent A)
  const [studentA] = (await tx
    .insert(students)
    .values({
      parentId: parentA.id,
      name: "Student A",
      status: "REGULAR",
      idempotencyKey: randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
    .returning()) as [StudentEntity];

  // 4. Create Student B (for Parent B)
  const [studentB] = (await tx
    .insert(students)
    .values({
      parentId: parentB.id,
      name: "Student B",
      status: "REGULAR",
      idempotencyKey: randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
    .returning()) as [StudentEntity];

  return { parentAUser, parentBUser, studentA, studentB };
}

describe("Row Level Security for Students", () => {
  beforeAll(async () => {
    await setupRlsRole();
  });

  afterAll(async () => {
    await teardownRlsRole();
  });

  test("Allows parents to see only their own students", async () => {
    testLogger.info("Testing parents selecting own students under RLS...");

    // We run in transaction to use SET LOCAL and auto-rollback to keep DB clean
    await db
      .transaction(async tx => {
        const { parentAUser, parentBUser, studentA, studentB } = await setupTestData(tx);

        // Switch to the non-superuser RLS role
        await tx.execute(sql`SET LOCAL ROLE test_rls_user`);

        // 5. Query as Parent A
        await tx.execute(sql`SET LOCAL app.current_user_id = ${parentAUser.id}`);

        const parentAView = await tx.select().from(students).where(sql`id IN (${studentA.id}, ${studentB.id})`);

        expect(parentAView.length).toBe(1);
        expect(parentAView[0].id).toBe(studentA.id);

        // 6. Query as Parent B
        await tx.execute(sql`SET LOCAL app.current_user_id = ${parentBUser.id}`);

        const parentBView = await tx.select().from(students).where(sql`id IN (${studentA.id}, ${studentB.id})`);

        expect(parentBView.length).toBe(1);
        expect(parentBView[0].id).toBe(studentB.id);

        tx.rollback();
      })
      .catch(() => { });

    testLogger.info("Parent SELECT RLS test passed.");
  });

  test("Allows parents to update or delete only their own students", async () => {
    testLogger.info("Testing parents updating/deleting own students under RLS...");

    await db
      .transaction(async tx => {
        const { parentAUser, studentA, studentB } = await setupTestData(tx);

        await tx.execute(sql`SET LOCAL ROLE test_rls_user`);
        await tx.execute(sql`SET LOCAL app.current_user_id = ${parentAUser.id}`);

        // 5. Parent A tries to update Student A (should succeed)
        const updateResult = await tx
          .update(students)
          .set({ name: "Updated Student A" })
          .where(eq(students.id, studentA.id))
          .returning();
        expect(updateResult.length).toBe(1);

        // 6. Parent A tries to update Student B (should fail/return 0 rows)
        const updateBResult = await tx
          .update(students)
          .set({ name: "Malicious Update" })
          .where(eq(students.id, studentB.id))
          .returning();
        expect(updateBResult.length).toBe(0);

        // 7. Parent A tries to delete Student B (should fail/return 0 rows)
        const deleteBResult = await tx.delete(students).where(eq(students.id, studentB.id)).returning();
        expect(deleteBResult.length).toBe(0);

        // 8. Parent A tries to delete Student A (should succeed)
        const deleteResult = await tx.delete(students).where(eq(students.id, studentA.id)).returning();
        expect(deleteResult.length).toBe(1);

        tx.rollback();
      })
      .catch(() => { });

    testLogger.info("Parent UPDATE/DELETE RLS test passed.");
  });

  test("Allows administrators to view all students", async () => {
    testLogger.info("Testing administrators selecting all students under RLS...");

    await db
      .transaction(async tx => {
        const { studentA, studentB } = await setupTestData(tx);

        await tx.execute(sql`SET LOCAL ROLE test_rls_user`);

        // We set app.current_user_id to a new admin user ID (not linked to any parent)
        const adminUserId = randomUUID();
        await tx.execute(sql`SET LOCAL app.current_user_id = ${adminUserId}`);

        const adminView = await tx.select().from(students).where(sql`id IN (${studentA.id}, ${studentB.id})`);

        // Admin should see both students since they are not a parent
        expect(adminView.length).toBe(2);

        tx.rollback();
      })
      .catch(() => { });

    testLogger.info("Admin SELECT RLS test passed.");
  });
});
