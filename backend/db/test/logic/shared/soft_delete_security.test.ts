// cspell:ignore: proname prosecdef pronamespace nspname
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db, isSqlite } from "@/backend/db";
import { AuditRepository } from "@/backend/db/repo/audit";
import { SoftDeleteRepository } from "@/backend/db/repo/shared";
import { auditLogs, users } from "@/backend/db/schema";
import { createTestUser } from "@/backend/db/test/entity-setup";
import { runInRollback, setupRlsPolicies, setupRlsRole, teardownRlsRole } from "@/backend/db/test/test-utils";
import { testLogger } from "@/shared/lib/logger/testlogger";

const SOFT_DELETE_RLS_ROLE = "test_rls_user_soft_delete";

function isRecordArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value);
}

function getResultRows(result: unknown): Record<string, unknown>[] {
  if (typeof result === "object" && result !== null && "rows" in result && isRecordArray(result.rows)) {
    return result.rows;
  }
  if (isRecordArray(result)) return result;
  return [];
}

describe("Soft Delete Security (Issue #2)", () => {
  // RLS role/policy setup must happen outside runInRollback — these are DDL
  // operations that create database-level roles and policies, not transactional data.
  // Per AGENTS.md, RLS test setup is an exception to the runInRollback rule.
  beforeAll(async () => {
    testLogger.info("Setting up soft delete security test role...");
    await setupRlsRole(SOFT_DELETE_RLS_ROLE);
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
    await teardownRlsRole(SOFT_DELETE_RLS_ROLE);
  });

  test.skipIf(isSqlite())("Removes the SECURITY DEFINER soft_delete_row_trigger_fn function", async () => {
    testLogger.info("Verifying SECURITY DEFINER trigger function is removed...");
    await runInRollback(async tx => {
      const result = await tx.execute(sql`
        SELECT proname, prosecdef
        FROM pg_proc
        JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
        WHERE nspname = 'public' AND proname = 'soft_delete_row_trigger_fn'
      `);

      const rows = getResultRows(result);
      expect(rows).toHaveLength(0);
      testLogger.info("soft_delete_row_trigger_fn no longer exists.");
    });
  });

  test.skipIf(isSqlite())(
    "Verifies no SECURITY DEFINER functions remain in public schema for soft delete",
    async () => {
      testLogger.info("Scanning public schema for SECURITY DEFINER functions...");
      await runInRollback(async tx => {
        const result = await tx.execute(sql`
        SELECT proname
        FROM pg_proc
        JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
        WHERE nspname = 'public' AND prosecdef = true AND proname LIKE '%soft_delete%'
      `);

        const rows = getResultRows(result);
        expect(rows).toHaveLength(0);
        testLogger.info("No soft-delete SECURITY DEFINER functions found.");
      });
    }
  );

  test("Soft delete via repository creates audit log entry", async () => {
    testLogger.info("Testing audit trail on repository soft delete...");
    await runInRollback(async tx => {
      const user = await createTestUser(tx, {
        name: "Soft Delete Audit User",
        email: `soft-delete-audit-${randomUUID()}@example.com`,
      });

      const { entity, deletedAt } = await SoftDeleteRepository.softDeleteUser(user.id, null, tx);
      expect(entity.deletedAt).not.toBeNull();
      expect(deletedAt).toBeDefined();

      const auditEntries = await AuditRepository.getEntityAuditLogs("USER", user.id, 50, tx);
      const softDeleteEntry = auditEntries.find(entry => entry.action === "DELETE");

      expect(softDeleteEntry).toBeDefined();
      expect(softDeleteEntry?.metadata).toMatchObject({
        tableName: "users",
        softDelete: true,
      });

      testLogger.info("Audit trail soft delete test passed.");
    });
  });

  test.skipIf(isSqlite())("RLS role cannot hard delete or directly set deleted_at", async () => {
    testLogger.info("Testing RLS hard delete block and direct soft-delete block...");
    // RLS test: user must be created outside runInRollback because the RLS
    // transaction uses SET LOCAL ROLE which requires a real committed row.
    // Cleanup via hardDelete after the test. This is the AGENTS.md RLS exception.
    const user = await db.transaction(async tx =>
      createTestUser(tx, {
        name: "RLS Soft Delete User",
        email: `soft-delete-rls-${randomUUID()}@example.com`,
      })
    );

    try {
      await db.transaction(async tx => {
        const quotedRole = `"${SOFT_DELETE_RLS_ROLE}"`;
        await tx.execute(sql`SET LOCAL ROLE ${sql.raw(quotedRole)}`);

        const hardDeleteResult = await tx.delete(users).where(eq(users.id, user.id)).returning();
        expect(hardDeleteResult).toHaveLength(0);

        let directUpdateError: unknown = null;
        try {
          await tx.update(users).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, user.id));
        } catch (error) {
          directUpdateError = error;
        }
        expect(directUpdateError).not.toBeNull();

        tx.rollback();
      });
    } catch {
      // Ignore expected Drizzle transaction rollback error
    }

    const [activeRow] = await db.select().from(users).where(eq(users.id, user.id));
    expect(activeRow).toBeDefined();
    expect(activeRow.deletedAt).toBeNull();

    await SoftDeleteRepository.softDeleteUser(user.id);

    const auditEntries = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.entityId, user.id), eq(auditLogs.action, "DELETE")));
    expect(auditEntries.length).toBeGreaterThan(0);

    await SoftDeleteRepository.hardDelete("users", user.id);
    testLogger.info("RLS soft delete security test passed.");
  });

  test("Superuser can hard delete a soft-deleted record", async () => {
    testLogger.info("Testing superuser hard delete of soft-deleted record...");
    await runInRollback(async tx => {
      const user = await createTestUser(tx, {
        name: "Hard Delete User",
        email: `soft-delete-hard-${randomUUID()}@example.com`,
      });

      await SoftDeleteRepository.softDeleteUser(user.id, null, tx);

      const hardDeleted = await SoftDeleteRepository.hardDelete("users", user.id, tx);
      expect(hardDeleted.id).toBe(user.id);

      const remaining = await tx.select().from(users).where(eq(users.id, user.id));
      expect(remaining).toHaveLength(0);
      testLogger.info("Superuser hard delete test passed.");
    });
  });
});
