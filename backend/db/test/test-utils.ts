import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import type { UserEntity } from "../../types";
import { db } from "../drizzleDb";
import { users } from "../schema";

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Runs a function within a database transaction that is always rolled back.
 * This is useful for tests to ensure no data is persisted to the database.
 *
 * @param fn The function to run within the transaction.
 * @throws The error thrown by the function, if any.
 */
export async function runInRollback(fn: (tx: DbTransaction) => Promise<void>): Promise<void> {
  let assertionError: unknown = null;
  try {
    await db.transaction(async tx => {
      try {
        await fn(tx);
      } catch (error) {
        assertionError = error;
      }
      tx.rollback();
    });
  } catch {
    // Ignore expected Drizzle transaction rollback error
  }
  if (assertionError) {
    throw assertionError;
  }
}

/**
 * Convenience wrapper for bun:test to automatically run a test case in a rolled-back transaction.
 * Drastically reduces boilerplate and CodeScene structural duplication scores.
 */
export function testInRollback(name: string, fn: (tx: DbTransaction) => Promise<void>) {
  // We dynamically import test from bun:test to avoid global pollution if not in test env
  import("bun:test").then(({ test }) => {
    test(name, async () => {
      await runInRollback(fn);
    });
  });
}

/**
 * Creates a test user in the database.
 * @param tx Database transaction
 * @param overrides Optional field overrides
 */
export async function createTestUser(
  tx: DbTransaction,
  overrides: Partial<typeof users.$inferInsert> = {}
): Promise<UserEntity> {
  const now = new Date();
  const [user] = (await tx
    .insert(users)
    .values({
      name: overrides.name || "Test User",
      email: overrides.email || `user-${randomUUID()}@example.com`,
      password: overrides.password || "password",
      createdAt: overrides.createdAt || now,
      updatedAt: overrides.updatedAt || now,
      ...overrides,
    })
    .returning()) as [UserEntity];
  return user;
}

/**
 * Sets up a temporary RLS role for testing.
 * @param roleName Name of the role to create
 */
export async function setupRlsRole(roleName: string = "test_rls_user"): Promise<void> {
  const quotedRole = quoteIdent(roleName);

  await db.execute(
    sql.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${roleName}') THEN
        EXECUTE 'CREATE ROLE ${quotedRole} WITH LOGIN PASSWORD ''test_rls_pass''';
      END IF;
    END
    $$
  `)
  );

  await db.execute(sql.raw(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${quotedRole}`));
  await db.execute(sql.raw(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${quotedRole}`));
  await db.execute(sql.raw(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${quotedRole}`));
  await db.execute(sql.raw(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${quotedRole}`));
}

/**
 * Tears down the temporary RLS role.
 * @param roleName Name of the role to drop
 */
export async function teardownRlsRole(roleName: string = "test_rls_user"): Promise<void> {
  const quotedRole = quoteIdent(roleName);
  try {
    await db.execute(sql.raw(`REASSIGN OWNED BY ${quotedRole} TO postgres`));
    await db.execute(sql.raw(`DROP OWNED BY ${quotedRole}`));
    await db.execute(sql.raw(`DROP ROLE IF EXISTS ${quotedRole}`));
  } catch {
    // Ignore errors during teardown
  }
}

function quoteIdent(ident: string): string {
  return `"${ident.replaceAll('"', '""')}"`;
}
