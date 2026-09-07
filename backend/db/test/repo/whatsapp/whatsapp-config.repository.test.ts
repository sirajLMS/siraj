import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, isNotNull, sql } from "drizzle-orm";
import { db, isSqlite } from "@/backend/db";
import { WhatsappConfigRepository } from "@/backend/db/repo/whatsapp";
import { whatsappConfigs } from "@/backend/db/schema";
import {
  createTestUserWithDefaults,
  executeTxSql,
  expectSavepointError,
  runInRollback,
} from "@/backend/db/test/test-utils";
import type { DBTransaction, WhatsappConfigSeedInput, WhatsappConfigSelectType } from "@/backend/types";

const APP_SECRET_PLAIN = "test-app-secret-9f8e7d6c5b4a";
const ACCESS_TOKEN_PLAIN = "test-access-token-EAAG-1234567890";

/**
 * Runs the body inside the standard rolled-back transaction with a known
 * empty singleton table, so every case starts from the designed baseline
 * (zero configuration rows) and restores it on rollback.
 */
function configTest(name: string, fn: (tx: DBTransaction) => Promise<void>) {
  test(name, async () => {
    let completed = false;
    await runInRollback(async tx => {
      // Reset the singleton store inside the rolled-back transaction, so
      // every case starts from the designed baseline (zero configuration
      // rows); the rollback restores whatever the database held before the
      // test. `isNotNull(id)` is the explicit "all rows" marker required by
      // the `drizzle/enforce-delete-with-where` rule — the full-table delete
      // is intentional and rollback-protected, unlike the Tier 3 case where
      // separate-connection commits force snapshot + by-id cleanup instead.
      await tx.delete(whatsappConfigs).where(isNotNull(whatsappConfigs.id));
      await fn(tx);
      completed = true;
    });
    expect(completed).toBe(true);
  });
}

/**
 * Fixture input for upsert tests: the four credential fields are always
 * populated, while the remaining seed fields stay optional overrides.
 */
type WhatsappConfigFixtureInput = WhatsappConfigSeedInput &
  Required<Pick<WhatsappConfigSeedInput, "appId" | "appSecret" | "verifyToken" | "accessToken">>;

function configInput(overrides: WhatsappConfigSeedInput = {}): WhatsappConfigFixtureInput {
  return {
    appId: overrides.appId ?? `app-${randomUUID().slice(0, 8)}`,
    appSecret: overrides.appSecret ?? APP_SECRET_PLAIN,
    verifyToken: overrides.verifyToken ?? `verify-${randomUUID()}`,
    accessToken: overrides.accessToken ?? ACCESS_TOKEN_PLAIN,
    phoneNumberId: overrides.phoneNumberId,
    wabaId: overrides.wabaId,
    esConfigId: overrides.esConfigId,
    updatedByUserId: overrides.updatedByUserId,
  };
}

async function countRows(tx: DBTransaction): Promise<number> {
  return tx.$count(whatsappConfigs);
}

interface RawCredentialRow {
  appId: string | null;
  appSecret: string | null;
  accessToken: string | null;
  verifyToken: string | null;
}

function resultToRows(result: unknown): Record<string, unknown>[] {
  if (typeof result === "object" && result !== null && "rows" in result && Array.isArray(result.rows)) {
    return result.rows.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null);
  }
  return Array.isArray(result)
    ? result.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null)
    : [];
}

/** Reads the credential columns straight from the database, bypassing the driver's decryption. */
async function selectRawCredentials(tx: DBTransaction): Promise<RawCredentialRow[]> {
  const result = await executeTxSql(
    tx,
    sql`SELECT app_id, app_secret, access_token, verify_token FROM whatsapp_configs`
  );
  return resultToRows(result).map(row => ({
    appId: typeof row.app_id === "string" ? row.app_id : null,
    appSecret: typeof row.app_secret === "string" ? row.app_secret : null,
    accessToken: typeof row.access_token === "string" ? row.access_token : null,
    verifyToken: typeof row.verify_token === "string" ? row.verify_token : null,
  }));
}

/** Deletes configuration rows by primary key only — never a table-wide delete. */
async function deleteConfigRowsById(ids: string[]): Promise<void> {
  // Distinct primary keys delete independently, so the removals run in
  // parallel rather than awaited one by one.
  await Promise.all(ids.map(id => db.delete(whatsappConfigs).where(eq(whatsappConfigs.id, id))));
}

/**
 * Full snapshot of the committed singleton store, taken before a Tier 3
 * test starts (rollback cannot cover separate-connection commits).
 */
function snapshotConfigRows(): Promise<WhatsappConfigSelectType[]> {
  return db.select().from(whatsappConfigs);
}

/**
 * `field-encryption.ts` emits `iv:cipherText:authTag` (AES-256-GCM, all hex;
 * 12-byte IV, 16-byte auth tag). Anything in that shape cannot be the
 * plaintext — secrets must never rest unencrypted.
 */
function isAesGcmCiphertext(value: string): boolean {
  const parts = value.split(":");
  return (
    parts.length === 3 &&
    parts.every(part => /^[0-9a-f]+$/.test(part)) &&
    (parts[0]?.length ?? 0) === 24 &&
    (parts[2]?.length ?? 0) === 32
  );
}

describe("WhatsappConfigRepository — Tier 1 (get / upsert behavior)", () => {
  configTest("get returns null when no configuration row exists", async tx => {
    expect(await WhatsappConfigRepository.getWhatsappConfig(tx)).toBeNull();
  });

  configTest("upsert creates the singleton row when the table is empty", async tx => {
    const admin = await createTestUserWithDefaults(tx);
    const input = configInput({ updatedByUserId: admin.id });

    const row = await WhatsappConfigRepository.upsertWhatsappConfig(input, tx);

    expect(row.appId).toBe(input.appId);
    expect(row.appSecret).toBe(input.appSecret);
    expect(row.verifyToken).toBe(input.verifyToken);
    expect(row.accessToken).toBe(input.accessToken);
    expect(row.updatedByUserId).toBe(admin.id);
    expect(row.id).toBeDefined();
    expect(row.createdAt).toBeInstanceOf(Date);
    expect(await countRows(tx)).toBe(1);
  });

  configTest("get propagates the caller transaction — uncommitted writes are visible on the same tx", async tx => {
    const input = configInput();
    const saved = await WhatsappConfigRepository.upsertWhatsappConfig(input, tx);

    const loaded = await WhatsappConfigRepository.getWhatsappConfig(tx);
    expect(loaded?.id).toBe(saved.id);
    expect(loaded?.verifyToken).toBe(input.verifyToken);
  });

  configTest("upsert on an existing row merges fields instead of duplicating the row", async tx => {
    const first = await WhatsappConfigRepository.upsertWhatsappConfig(configInput(), tx);
    const nextToken = `verify-${randomUUID()}`;

    const second = await WhatsappConfigRepository.upsertWhatsappConfig({ verifyToken: nextToken }, tx);

    expect(second.id).toBe(first.id);
    expect(second.verifyToken).toBe(nextToken);
    expect(second.appId).toBe(first.appId);
    expect(await countRows(tx)).toBe(1);
  });
});

describe("WhatsappConfigRepository — Tier 2 (boundaries)", () => {
  configTest("explicit null clears a field while absent fields keep their values", async tx => {
    const first = await WhatsappConfigRepository.upsertWhatsappConfig(configInput(), tx);

    const cleared = await WhatsappConfigRepository.upsertWhatsappConfig({ appId: null, appSecret: null }, tx);

    expect(cleared.id).toBe(first.id);
    expect(cleared.appId).toBeNull();
    expect(cleared.appSecret).toBeNull();
    expect(cleared.verifyToken).toBe(first.verifyToken);
    const raw = await selectRawCredentials(tx);
    expect(raw).toHaveLength(1);
    expect(raw[0]?.appSecret).toBeNull();
  });

  configTest("empty-string values round-trip and stay distinct from null", async tx => {
    await WhatsappConfigRepository.upsertWhatsappConfig(configInput({ appId: "", verifyToken: "" }), tx);

    const row = await WhatsappConfigRepository.getWhatsappConfig(tx);
    expect(row?.appId).toBe("");
    expect(row?.verifyToken).toBe("");
  });

  configTest("unicode and emoji values round-trip unchanged", async tx => {
    const token = "🔐-رمز-التحقق-✓-ünïcode";

    await WhatsappConfigRepository.upsertWhatsappConfig(configInput({ verifyToken: token }), tx);

    expect((await WhatsappConfigRepository.getWhatsappConfig(tx))?.verifyToken).toBe(token);
  });

  configTest("a 255-character verify token fits the column and round-trips", async tx => {
    const token = "t".repeat(255);

    const row = await WhatsappConfigRepository.upsertWhatsappConfig(configInput({ verifyToken: token }), tx);

    expect(row.verifyToken).toBe(token);
  });

  configTest("a verify token beyond the column limit fails cleanly and leaves the row intact", async tx => {
    await WhatsappConfigRepository.upsertWhatsappConfig(configInput(), tx);

    const error = await expectSavepointError(
      () => WhatsappConfigRepository.upsertWhatsappConfig(configInput({ verifyToken: "x".repeat(256) }), tx),
      tx
    );
    // Drizzle wraps driver errors — the column message lives on the cause.
    const causeMessage = error.cause instanceof Error ? ` ${error.cause.message}` : "";
    expect(`${error.message}${causeMessage}`).toMatch(/value too long/i);
    expect(await countRows(tx)).toBe(1);
  });

  configTest("updatedByUserId attributes the saving administrator", async tx => {
    const admin = await createTestUserWithDefaults(tx);

    const row = await WhatsappConfigRepository.upsertWhatsappConfig(configInput({ updatedByUserId: admin.id }), tx);

    expect(row.updatedByUserId).toBe(admin.id);
  });

  configTest("an empty patch returns the existing row unchanged", async tx => {
    const first = await WhatsappConfigRepository.upsertWhatsappConfig(configInput(), tx);

    const unchanged = await WhatsappConfigRepository.upsertWhatsappConfig({}, tx);

    expect(unchanged.id).toBe(first.id);
    expect(unchanged.appId).toBe(first.appId);
    expect(unchanged.verifyToken).toBe(first.verifyToken);
    expect(await countRows(tx)).toBe(1);
  });
});

describe("WhatsappConfigRepository — Tier 3 (concurrency)", () => {
  // The singleton guarantee is defined across concurrent writers — separate
  // connections running their own transactions, the shape every real caller
  // (admin saves, seed persistence) produces. Two async flows sharing ONE
  // transaction interleave statements with no DB-level ordering guarantee
  // and no unique constraint to fall back on, so the repository contract
  // (like every repo here) requires callers to sequence writes on a shared
  // transaction. Lock contention needs a second connection, which cannot
  // see uncommitted rows — so these tests commit real rows. Cleanup is
  // snapshot-based: the committed store is captured first, removed for the
  // test window, and every created row is deleted by id while the snapshot
  // is restored — the shared dev database's credential store is never
  // wiped wholesale. SQLite has no advisory locks or FOR UPDATE; it
  // serializes writes at the file level by design.

  /**
   * Tier 3 cleanup: removes exactly the rows created during the test window
   * (every current row absent from the snapshot, by id) and re-inserts the
   * snapshotted rows — plaintext values re-encrypt at the driver boundary,
   * so the restored row is byte-for-byte equivalent in content.
   */
  async function restoreConfigRows(snapshot: WhatsappConfigSelectType[]): Promise<void> {
    const currentIds = (await db.select({ id: whatsappConfigs.id }).from(whatsappConfigs)).map(row => row.id);
    const snapshotIds = new Set(snapshot.map(row => row.id));
    await deleteConfigRowsById(currentIds.filter(id => !snapshotIds.has(id)));
    // Distinct primary keys with `onConflictDoNothing` insert independently,
    // so the restores run in parallel rather than awaited one by one.
    await Promise.all(snapshot.map(row => db.insert(whatsappConfigs).values(row).onConflictDoNothing()));
  }

  test.skipIf(isSqlite())(
    "parallel saves on separate connections update the existing row without duplicating it",
    async () => {
      const snapshot = await snapshotConfigRows();
      const first = configInput();
      const second = configInput();

      try {
        await deleteConfigRowsById(snapshot.map(row => row.id));
        const fixture = await db.transaction(t => WhatsappConfigRepository.upsertWhatsappConfig(first, t));

        expect((await WhatsappConfigRepository.getWhatsappConfig())?.id).toBe(fixture.id);

        // One contender passes no transaction (the repository opens its own);
        // the other brings an explicit one — both must serialize.
        const outcomes = await Promise.allSettled([
          WhatsappConfigRepository.upsertWhatsappConfig(second),
          db.transaction(t => WhatsappConfigRepository.upsertWhatsappConfig(first, t)),
        ]);
        const fulfilled = outcomes.filter(outcome => outcome.status === "fulfilled");
        expect(fulfilled).toHaveLength(2);

        expect(await db.$count(whatsappConfigs)).toBe(1);
        const row = await WhatsappConfigRepository.getWhatsappConfig();
        expect([first.verifyToken, second.verifyToken]).toContain<string | null>(row?.verifyToken ?? null);
      } finally {
        await restoreConfigRows(snapshot);
      }
    }
  );

  test.skipIf(isSqlite())("parallel first saves from an empty table create exactly one row", async () => {
    const snapshot = await snapshotConfigRows();
    const first = configInput();
    const second = configInput();

    try {
      await deleteConfigRowsById(snapshot.map(row => row.id));

      // The create path is the dangerous race: FOR UPDATE has no row to lock
      // while the table is empty, so without the upsert's transaction-scoped
      // lock both writers would insert and the table would end up with two
      // singletons. This assertion is only meaningful because both writers
      // run on real separate connections.
      const outcomes = await Promise.allSettled([
        WhatsappConfigRepository.upsertWhatsappConfig(first),
        db.transaction(t => WhatsappConfigRepository.upsertWhatsappConfig(second, t)),
      ]);
      const fulfilled = outcomes.filter(outcome => outcome.status === "fulfilled");
      expect(fulfilled).toHaveLength(2);

      expect(await db.$count(whatsappConfigs)).toBe(1);
      const row = await WhatsappConfigRepository.getWhatsappConfig();
      expect([first.verifyToken, second.verifyToken]).toContain<string | null>(row?.verifyToken ?? null);
    } finally {
      await restoreConfigRows(snapshot);
    }
  });
});

describe("WhatsappConfigRepository — Tier 4 (encryption & injection safety)", () => {
  configTest("stores app_secret and access_token as ciphertext at rest while plaintext round-trips", async tx => {
    const input = configInput();

    await WhatsappConfigRepository.upsertWhatsappConfig(input, tx);

    const raw = await selectRawCredentials(tx);
    expect(raw).toHaveLength(1);
    const storedSecret = raw[0]?.appSecret ?? "";
    const storedToken = raw[0]?.accessToken ?? "";
    expect(isAesGcmCiphertext(storedSecret)).toBe(true);
    expect(isAesGcmCiphertext(storedToken)).toBe(true);
    expect(storedSecret).not.toContain(input.appSecret);
    expect(storedToken).not.toContain(input.accessToken);

    const loaded = await WhatsappConfigRepository.getWhatsappConfig(tx);
    expect(loaded?.appSecret).toBe(input.appSecret);
    expect(loaded?.accessToken).toBe(input.accessToken);
  });

  configTest("re-encrypts replaced secrets on the update path", async tx => {
    const rotatedSecret = "test-app-secret-rotated-1a2b3c";
    const rotatedToken = "test-access-token-rotated-EAAG-0987654321";
    await WhatsappConfigRepository.upsertWhatsappConfig(configInput(), tx);
    const before = await selectRawCredentials(tx);

    await WhatsappConfigRepository.upsertWhatsappConfig(
      configInput({ appSecret: rotatedSecret, accessToken: rotatedToken }),
      tx
    );
    const after = await selectRawCredentials(tx);

    expect(after[0]?.appSecret).not.toBe(before[0]?.appSecret);
    expect(isAesGcmCiphertext(after[0]?.appSecret ?? "")).toBe(true);
    expect(isAesGcmCiphertext(after[0]?.accessToken ?? "")).toBe(true);
    expect(after[0]?.appSecret ?? "").not.toContain(rotatedSecret);
    expect(after[0]?.accessToken ?? "").not.toContain(rotatedToken);

    const loaded = await WhatsappConfigRepository.getWhatsappConfig(tx);
    expect(loaded?.appSecret).toBe(rotatedSecret);
    expect(loaded?.accessToken).toBe(rotatedToken);
  });

  configTest("string fields are parameterized — injection payloads round-trip literally", async tx => {
    const injectionAppId = "x'; DROP TABLE whatsapp_configs; --";
    const injectionToken = "1' OR '1'='1";

    await WhatsappConfigRepository.upsertWhatsappConfig(
      configInput({ appId: injectionAppId, verifyToken: injectionToken }),
      tx
    );

    expect(await countRows(tx)).toBe(1);
    const row = await WhatsappConfigRepository.getWhatsappConfig(tx);
    expect(row?.appId).toBe(injectionAppId);
    expect(row?.verifyToken).toBe(injectionToken);
  });
});
