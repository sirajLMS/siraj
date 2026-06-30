import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import type { UserEntity } from "@/backend/types";
import type { DBTransaction } from "../db.types";
import { db } from "../drizzleDb";
import { users } from "../schema";

/**
 * Runs a function within a database transaction that is always rolled back.
 * This is useful for tests to ensure no data is persisted to the database.
 *
 * @param fn The function to run within the transaction.
 * @throws The error thrown by the function, if any.
 */
export async function runInRollback(fn: (tx: DBTransaction) => Promise<void>): Promise<void> {
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
export function testInRollback(name: string, fn: (tx: DBTransaction) => Promise<void>) {
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
  tx: DBTransaction,
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
const rlsRoleRefCounts = new Map<string, number>();

export async function setupRlsRole(roleName: string = "test_rls_user"): Promise<void> {
  const currentCount = rlsRoleRefCounts.get(roleName) ?? 0;
  rlsRoleRefCounts.set(roleName, currentCount + 1);

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

  await executeGrantWithRetry(quotedRole);
}

async function executeGrantWithRetry(quotedRole: string): Promise<void> {
  const grantStatements = [
    `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${quotedRole}`,
    `GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${quotedRole}`,
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${quotedRole}`,
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${quotedRole}`,
  ];

  for (const stmt of grantStatements) {
    await retryOnConcurrentConflict(() => db.execute(sql.raw(stmt)), 5);
  }
}

async function retryOnConcurrentConflict(fn: () => Promise<unknown>, maxRetries = 3): Promise<void> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await fn();
      return;
    } catch (e) {
      if (isConcurrentConflictError(e) && attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
}

function isConcurrentConflictError(e: unknown): boolean {
  let msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("tuple concurrently updated") || msg.includes("deadlock detected") || msg.includes("40P01")) {
    return true;
  }
  const cause = e instanceof Error ? (e as { cause?: unknown }).cause : undefined;
  if (cause instanceof Error) {
    msg = cause.message;
    if (msg.includes("tuple concurrently updated") || msg.includes("deadlock detected") || msg.includes("40P01")) {
      return true;
    }
  }
  return false;
}

/**
 * Tears down the temporary RLS role.
 * @param roleName Name of the role to drop
 */
export async function teardownRlsRole(roleName: string = "test_rls_user"): Promise<void> {
  const currentCount = rlsRoleRefCounts.get(roleName) ?? 0;
  if (currentCount > 1) {
    rlsRoleRefCounts.set(roleName, currentCount - 1);
    return;
  }

  rlsRoleRefCounts.delete(roleName);
}

const installedPolicies = new Set<string>();

export type RlsPolicyDef = {
  table: string;
  name: string;
  definition: string;
};

function isPolicyConflictError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("duplicate_object") || msg.includes("already exists")) return true;
  const cause = e instanceof Error ? (e as { cause?: { code?: string } }).cause : undefined;
  const code = cause && typeof cause === "object" && "code" in cause ? (cause as { code: string }).code : "";
  return code === "42710";
}

async function installPolicy(policy: RlsPolicyDef): Promise<void> {
  const tbl = quoteIdent(policy.table);
  const pol = quoteIdent(policy.name);
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await db.execute(sql.raw(`DROP POLICY IF EXISTS ${pol} ON ${tbl}`));
      await db.execute(sql.raw(`CREATE POLICY ${pol} ON ${tbl} ${policy.definition}`));
      return;
    } catch (e) {
      const isConflict = isPolicyConflictError(e);
      const isDeadlock = isConcurrentConflictError(e);
      if ((isConflict || isDeadlock) && attempt < 4) {
        await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
}

export async function setupRlsPolicies(policies: RlsPolicyDef[]): Promise<void> {
  for (const policy of policies) {
    const key = `${policy.table}.${policy.name}`;
    if (installedPolicies.has(key)) continue;
    installedPolicies.add(key);
    await installPolicy(policy);
  }
}

function quoteIdent(ident: string): string {
  return `"${ident.replaceAll('"', '""')}"`;
}

const rlsClientCache = new Map<string, import("pg").Pool>();

export async function queryAsRlsRole<T>(
  roleName: string,
  userId: string,
  querySql: string,
  params: unknown[] = []
): Promise<T[]> {
  let pool = rlsClientCache.get(roleName);
  if (!pool) {
    const { Pool } = await import("pg");
    const base = new URL(process.env.DATABASE_URL);
    base.username = roleName;
    base.password = "test_rls_pass";
    pool = new Pool({ connectionString: base.toString(), max: 1 });
    rlsClientCache.set(roleName, pool);
  }

  const client = await pool.connect();
  try {
    await client.query(`SELECT set_config('app.current_user_id', $1, false)`, [userId]);
    const result = await client.query(querySql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function closeRlsClients(): Promise<void> {
  for (const [, pool] of rlsClientCache) {
    await pool.end();
  }
  rlsClientCache.clear();
}
