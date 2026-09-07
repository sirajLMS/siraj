import { asc, eq } from "drizzle-orm";
import { db, queryDb, withForUpdate } from "@/backend/db";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import { whatsappConfigs } from "@/backend/db/schema";
import type {
  DBQueryExecutor,
  DBTransaction,
  WhatsappConfigSeedInput,
  WhatsappConfigSelectType,
} from "@/backend/types";

/**
 * Advisory-lock key serializing configuration writes across connections.
 * `FOR UPDATE` alone cannot protect the create path: with an empty table a
 * `SELECT ... FOR UPDATE` has no row to lock, so two racing writers would
 * both observe "no configuration" and both insert. The transaction-scoped
 * advisory lock closes that phantom-insert window; the row lock then keeps
 * the read-modify-write of the update path atomic.
 */
const UPSERT_LOCK_KEY = "whatsapp-config-upsert";

/**
 * One field of an upsert patch. Fields omitted by the caller arrive as
 * `undefined`, which keeps their stored values untouched; an explicit `null`
 * clears the column.
 */
type WhatsappConfigPatchValue = WhatsappConfigSeedInput[keyof WhatsappConfigSeedInput] | undefined;

/**
 * Runs the transactional body in the caller's scope when one is provided,
 * otherwise opens a dedicated transaction. Configuration writes mutate the
 * singleton row and must hold locks, which only exist inside a transaction
 * — the write path therefore takes a real transaction handle, never a bare
 * executor (whose auto-commit statements would silently release the locks).
 */
async function runWithTx<T>(runner: (t: DBTransaction) => Promise<T>, tx?: DBTransaction): Promise<T> {
  return tx ? runner(tx) : db.transaction(runner);
}

/**
 * Applies one update-or-insert cycle for the singleton row while holding the
 * advisory lock and the row lock. Provided fields merge onto the current row
 * (absent fields keep their values); an empty patch is a no-op read-back.
 */
async function applySingletonUpsert(
  t: DBTransaction,
  input: WhatsappConfigSeedInput
): Promise<WhatsappConfigSelectType> {
  await acquireAdvisoryLock(t, UPSERT_LOCK_KEY);
  const [existing] = await withForUpdate(
    t.select().from(whatsappConfigs).orderBy(asc(whatsappConfigs.createdAt))
  ).limit(1);
  if (!existing) {
    const now = new Date();
    const [created] = await t
      .insert(whatsappConfigs)
      .values({ ...input, createdAt: now, updatedAt: now })
      .returning();
    return created;
  }
  const patchValues: WhatsappConfigPatchValue[] = Object.values(input);
  if (!patchValues.some(value => value !== undefined)) {
    return existing;
  }
  const [updated] = await t.update(whatsappConfigs).set(input).where(eq(whatsappConfigs.id, existing.id)).returning();
  return updated;
}

/**
 * Repository for the `whatsapp_configs` table — the single-row credential
 * store managed from the WhatsApp settings page.
 *
 * Singleton discipline is owned here: the table carries no unique constraint
 * beyond its random primary key, so every write must go through
 * `upsertWhatsappConfig`, which serializes concurrent writers and never
 * creates a second row.
 *
 * Pure data access only — no business logic or permissions. All methods
 * propagate an optional caller transaction instead of running their own.
 */
export namespace WhatsappConfigRepository {
  /**
   * The active WhatsApp Cloud API credentials, or `null` while the
   * deployment has never saved a configuration (callers fall back to env).
   * Oldest row first, so the returned row is stable even if historical data
   * ever contained more than one.
   *
   * `appSecret` and `accessToken` come back decrypted (the `encryptedText`
   * column type decrypts at the driver boundary) — service-layer credential
   * resolution only; API layers must expose masked views instead.
   */
  export async function getWhatsappConfig(tx?: DBQueryExecutor): Promise<WhatsappConfigSelectType | null> {
    const [row] = await queryDb(tx).select().from(whatsappConfigs).orderBy(asc(whatsappConfigs.createdAt)).limit(1);
    return row ?? null;
  }

  /**
   * Creates or updates the singleton credential row and returns the stored
   * entity. Safe under concurrency: writers queue on the advisory lock, and
   * the read-modify-write holds the row lock until commit, so parallel saves
   * converge on one updated row instead of duplicating it.
   *
   * Merge semantics: fields present in `input` are written (an explicit
   * `null` clears the column), absent fields keep their current values.
   * `appSecret` and `accessToken` are handed over as plaintext — encryption
   * happens transparently at the driver boundary, so no manual encryption
   * and no ciphertext ever passes through this method.
   */
  export async function upsertWhatsappConfig(
    input: WhatsappConfigSeedInput,
    tx?: DBTransaction
  ): Promise<WhatsappConfigSelectType> {
    return runWithTx(t => applySingletonUpsert(t, input), tx);
  }
}
