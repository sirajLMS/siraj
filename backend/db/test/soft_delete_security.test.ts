// cspell:ignore: proname prosecdef pronamespace nspname
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { testLogger } from "../../../lib/testlogger";
import { db } from "../drizzleDb";
import { AuditRepository, SoftDeleteRepository } from "../repo";
import { auditLogs, users } from "../schema";

describe("Soft Delete Security (Issue #2)", () => {
  beforeAll(async () => {
    testLogger.info("Setting up soft delete security test role...");
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'test_rls_user_soft_delete') THEN
          CREATE ROLE test_rls_user_soft_delete WITH LOGIN PASSWORD 'test_rls_pass';
        END IF;
      END
      $$;
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_rls_user_soft_delete;
      GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_rls_user_soft_delete;
    `);
  });

  afterAll(async () => {
    try {
      await db.execute(sql`
        REASSIGN OWNED BY test_rls_user_soft_delete TO postgres;
        DROP OWNED BY test_rls_user_soft_delete;
        DROP ROLE IF EXISTS test_rls_user_soft_delete;
      `);
    } catch {
      testLogger.warn("Failed to drop soft delete security test role");
    }
  });

  test("Removes the SECURITY DEFINER soft_delete_row_trigger_fn function", async () => {
    testLogger.info("Verifying SECURITY DEFINER trigger function is removed...");
    const result = await db.execute(sql`
      SELECT proname, prosecdef
      FROM pg_proc
      JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
      WHERE nspname = 'public' AND proname = 'soft_delete_row_trigger_fn'
    `);

    const rows = "rows" in result ? result.rows : (result as unknown as Record<string, unknown>[]);
    expect(rows.length).toBe(0);
    testLogger.info("soft_delete_row_trigger_fn no longer exists.");
  });

  test("Verifies no SECURITY DEFINER functions remain in public schema for soft delete", async () => {
    testLogger.info("Scanning public schema for SECURITY DEFINER functions...");
    const result = await db.execute(sql`
      SELECT proname
      FROM pg_proc
      JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
      WHERE nspname = 'public' AND prosecdef = true AND proname LIKE '%soft_delete%'
    `);

    const rows = "rows" in result ? result.rows : (result as unknown as Record<string, unknown>[]);
    expect(rows.length).toBe(0);
    testLogger.info("No soft-delete SECURITY DEFINER functions found.");
  });

  test("Soft delete via repository creates audit log entry", async () => {
    testLogger.info("Testing audit trail on repository soft delete...");
    const email = `soft-delete-audit-${randomUUID()}@example.com`;
    const now = new Date();

    const [user] = await db
      .insert(users)
      .values({
        name: "Soft Delete Audit User",
        email,
        password: "securePassword",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const { entity, deletedAt } = await SoftDeleteRepository.softDeleteUser(user.id);
    expect(entity.deletedAt).not.toBeNull();
    expect(deletedAt).toBeDefined();

    const auditEntries = await AuditRepository.getEntityAuditLogs("USER", user.id);
    const softDeleteEntry = auditEntries.find(entry => entry.action === "DELETE");

    expect(softDeleteEntry).toBeDefined();
    expect(softDeleteEntry?.metadata).toMatchObject({
      tableName: "users",
      softDelete: true,
    });

    await SoftDeleteRepository.hardDelete("users", user.id);
    testLogger.info("Audit trail soft delete test passed.");
  });

  test("RLS role cannot hard delete or directly set deleted_at", async () => {
    testLogger.info("Testing RLS hard delete block and direct soft-delete block...");
    const email = `soft-delete-rls-${randomUUID()}@example.com`;
    const now = new Date();

    const [user] = await db
      .insert(users)
      .values({
        name: "RLS Soft Delete User",
        email,
        password: "securePassword",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    try {
      await db.transaction(async tx => {
        await tx.execute(sql`SET LOCAL ROLE test_rls_user_soft_delete`);

        const hardDeleteResult = await tx.delete(users).where(eq(users.id, user.id)).returning();
        expect(hardDeleteResult.length).toBe(0);

        let directUpdateError: unknown = null;
        try {
          await tx.update(users).set({ deletedAt: now, updatedAt: now }).where(eq(users.id, user.id));
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
    const email = `soft-delete-hard-${randomUUID()}@example.com`;
    const now = new Date();

    const [user] = await db
      .insert(users)
      .values({
        name: "Hard Delete User",
        email,
        password: "securePassword",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await SoftDeleteRepository.softDeleteUser(user.id);

    const hardDeleted = await SoftDeleteRepository.hardDelete("users", user.id);
    expect(hardDeleted.id).toBe(user.id);

    const remaining = await db.select().from(users).where(eq(users.id, user.id));
    expect(remaining.length).toBe(0);
    testLogger.info("Superuser hard delete test passed.");
  });
});
