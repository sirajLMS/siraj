import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db, isSqlite } from "@/backend/db";
import { withCurrentUser } from "@/backend/db/repo/shared";
import { parents, students, users } from "@/backend/db/schema";
import {
  generateTestPassword,
  runInRollback,
  setupRlsPolicies,
  setupRlsRole,
  teardownRlsRole,
} from "@/backend/db/test/test-utils";
import type { DBTransaction } from "@/backend/types";

/**
 * Reads the raw `app.current_user_id` GUC value (NULL when unset).
 */
async function readCurrentSetting(tx: DBTransaction): Promise<string | null> {
  const result = await tx.execute(sql`SELECT current_setting('app.current_user_id', true) AS value`);
  const value: unknown = result.rows[0]?.value;
  return typeof value === "string" || value === null ? value : null;
}

/**
 * Creates a user row with a unique email.
 */
async function insertUserRow(tx: DBTransaction, name: string, now: Date) {
  const [user] = await tx
    .insert(users)
    .values({
      name,
      email: `with-current-user-${randomUUID()}@example.com`,
      password: generateTestPassword(),
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return user;
}

/**
 * Creates a parent linked to the given user id.
 */
async function insertParentRow(tx: DBTransaction, userId: string, now: Date) {
  const [parent] = await tx
    .insert(parents)
    .values({ userId, status: "REGULAR", createdAt: now, updatedAt: now })
    .returning();
  return parent;
}

/**
 * Creates a student (plus its linked user row) under the given parent id.
 */
async function insertStudentRow(tx: DBTransaction, parentId: string, name: string, now: Date) {
  const studentUser = await insertUserRow(tx, `${name} User`, now);
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
 * Sets up two parents (A and B) with one student each for parent-scoped RLS assertions.
 */
async function setupScopedStudents(tx: DBTransaction) {
  const now = new Date();
  const parentAUser = await insertUserRow(tx, "Parent A", now);
  const parentA = await insertParentRow(tx, parentAUser.id, now);
  const parentBUser = await insertUserRow(tx, "Parent B", now);
  const parentB = await insertParentRow(tx, parentBUser.id, now);
  const studentA = await insertStudentRow(tx, parentA.id, "Student A", now);
  const studentB = await insertStudentRow(tx, parentB.id, "Student B", now);
  return { parentAUser, parentBUser, studentA, studentB };
}

describe.skipIf(isSqlite())("withCurrentUser GUC helper", () => {
  beforeAll(async () => {
    await setupRlsRole();
    await setupRlsPolicies([
      {
        table: "students",
        name: "students_select_policy",
        definition:
          "FOR SELECT USING (NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id()) OR parent_id = (SELECT id FROM parents WHERE user_id = current_user_id()))",
      },
    ]);
  });

  afterAll(async () => {
    await teardownRlsRole();
  });

  test("Sets app.current_user_id inside the callback for raw setting reads and current_user_id()", async () => {
    await runInRollback(async tx => {
      const userId = randomUUID();

      await withCurrentUser(tx, userId, async t => {
        expect(await readCurrentSetting(t)).toBe(userId);

        const fnResult = await t.execute(sql`SELECT current_user_id() AS uid`);
        expect(fnResult.rows[0]?.uid).toBe(userId);
      });
    });
  });

  test("Keeps the GUC transaction-local and clears it once the transaction ends", async () => {
    const userId = randomUUID();
    let settingAfterCallback = "unset";

    await runInRollback(async tx => {
      await withCurrentUser(tx, userId, async t => {
        await readCurrentSetting(t);
      });

      // set_config(..., is_local = true) persists for the remainder of the surrounding
      // transaction — it is only cleared when that transaction ends.
      settingAfterCallback = (await readCurrentSetting(tx)) ?? "unset";
    });

    expect(settingAfterCallback).toBe(userId);

    const postTxResult = await db.execute(sql`SELECT current_setting('app.current_user_id', true) AS value`);
    // The GUC reverts to unset (NULL or the empty string placeholder) once the transaction ends.
    expect(postTxResult.rows[0]?.value === null || postTxResult.rows[0]?.value === "").toBe(true);
  });

  test("Scopes students select under the GUC to parent A's children", async () => {
    await runInRollback(async tx => {
      const { parentAUser, studentA, studentB } = await setupScopedStudents(tx);
      const studentIds = sql`id IN (${studentA.id}, ${studentB.id})`;

      await tx.execute(sql`SET LOCAL ROLE test_rls_user`);

      await withCurrentUser(tx, parentAUser.id, async t => {
        const parentAView = await t.select({ id: students.id }).from(students).where(studentIds);
        expect(parentAView).toHaveLength(1);
        expect(parentAView[0]?.id).toBe(studentA.id);
      });
    });
  });
});
