import { sql } from "drizzle-orm";
import { db } from "../drizzleDb";

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
  return `"${ident.replace(/"/g, '""')}"`;
}
