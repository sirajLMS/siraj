import { sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { isEncryptedFieldValue } from "@/backend/lib/env-config.helpers";
import { encryptField } from "@/backend/lib/field-encryption";
import { logger } from "@/backend/lib/logger";

/**
 * One-shot, idempotent backfill: encrypts legacy plaintext values in the
 * display-only PII columns that were converted to the `encryptedText`
 * schema type (teachers.phone, teachers.dateOfBirth, parents.address,
 * parents.whatsapp).
 *
 * Values are read through raw SQL so the stored representation is inspected
 * as-is — already-encrypted values (the canonical ciphertext shape: the
 * versioned `v1:iv:cipherText:authTag` format or the legacy un-prefixed shape,
 * per `isEncryptedFieldValue`) are skipped; plaintext values are rewritten
 * through `encryptField` in the versioned format. Re-running is safe: the
 * second pass finds only ciphertext values and reports them as
 * already-encrypted.
 *
 * Values are written WITHOUT a row-bound encryption context: the schema-level
 * `encryptedText` driver mapping that later reads these columns cannot supply
 * row context on decrypt (custom types only see the stored value), so
 * row-bound additional authenticated data would make the values unreadable.
 *
 * Columns queried/filtered in SQL (users.phone, students.dateOfBirth) are
 * intentionally NOT encrypted and never appear here — encrypting them would
 * break `UserRepository.findByPhone` and the student birth-date filters.
 *
 * Requires DATABASE_ENCRYPTION_KEY (same key the schema's encryptedText
 * mapping uses — a different key makes existing ciphertext unreadable).
 *
 * Usage:
 *   bun run scripts/encrypt-legacy-pii.ts             # encrypt all columns
 *   bun run scripts/encrypt-legacy-pii.ts --dryRun     # report only, no writes
 *   bun run scripts/encrypt-legacy-pii.ts --help
 */

const DRY_RUN_FLAG = "--dryRun";
const HELP_FLAG = "--help";

/** Safety cap on rows fetched per column per run — unbounded-SELECT guard. */
const MAX_ROWS_PER_COLUMN = 100_000;

const LOG_PREFIX = "[EncryptLegacyPii]";

interface PiiColumn {
  readonly label: string;
  readonly table: string;
  readonly column: string;
}

const PII_COLUMNS: readonly PiiColumn[] = [
  { label: "teachers.phone", table: "teachers", column: "phone" },
  { label: "teachers.dateOfBirth", table: "teachers", column: "date_of_birth" },
  { label: "parents.address", table: "parents", column: "address" },
  { label: "parents.whatsapp", table: "parents", column: "whatsapp" },
];

interface ParsedArgs {
  readonly dryRun: boolean;
  readonly help: boolean;
}

const parseArgs = (argv: readonly string[]): ParsedArgs => {
  let dryRun = false;
  let help = false;
  for (const arg of argv) {
    if (arg === DRY_RUN_FLAG) dryRun = true;
    else if (arg === HELP_FLAG) help = true;
    else logger.warn(`${LOG_PREFIX} ignoring unknown argument: ${arg}`);
  }
  return { dryRun, help };
};

const printHelp = (): void => {
  logger.info(
    [
      "Encrypt legacy plaintext PII columns (idempotent backfill).",
      "",
      "Usage: bun run scripts/encrypt-legacy-pii.ts [--dryRun]",
      "",
      "  --dryRun  Report how many plaintext values exist without writing.",
      "  --help    Show this help.",
      "",
      "Targets teachers.phone, teachers.dateOfBirth, parents.address,",
      "parents.whatsapp. Requires DATABASE_ENCRYPTION_KEY to be set.",
    ].join("\n")
  );
};

/** Type guard: normalizes the driver-dependent `db.execute` result to a plain rows array. */
const isRecordArray = (value: unknown): value is Array<Record<string, unknown>> =>
  Array.isArray(value) &&
  value.every((item): item is Record<string, unknown> => typeof item === "object" && item !== null);

const hasRowsProperty = (value: unknown): value is { rows: unknown } =>
  typeof value === "object" && value !== null && "rows" in value;

const executeRows = async (query: ReturnType<typeof sql>): Promise<Array<Record<string, unknown>>> => {
  const result: unknown = await db.execute(query);
  if (isRecordArray(result)) return result;
  if (hasRowsProperty(result) && isRecordArray(result.rows)) return result.rows;
  return [];
};

interface BackfillStats {
  readonly encrypted: number;
  readonly skippedEncrypted: number;
  readonly empty: number;
}

/**
 * Encrypts legacy plaintext values in one column. Values are read and written
 * with raw SQL so the stored representation is never silently transformed by
 * the encryptedText driver mapping — the script owns the plaintext/ciphertext
 * distinction explicitly. Sequential per-row updates (via reduce) rather than
 * Promise.all: rows are few and writes are cheap, and a serial run interleaves
 * safely with live traffic.
 */
const backfillColumn = async (column: PiiColumn, dryRun: boolean): Promise<BackfillStats> => {
  // Quoted identifiers hoisted out of the SQL templates (sonarjs forbids nested template literals).
  const quotedTable = `"${column.table}"`;
  const quotedColumn = `"${column.column}"`;
  const rows = await executeRows(
    sql`SELECT id, ${sql.raw(quotedColumn)} AS value
        FROM ${sql.raw(quotedTable)}
        WHERE ${sql.raw(quotedColumn)} IS NOT NULL
          AND ${sql.raw(quotedColumn)} <> ''
        LIMIT ${MAX_ROWS_PER_COLUMN}`
  );

  let encrypted = 0;
  let skippedEncrypted = 0;
  await rows.reduce(async (chain, row) => {
    await chain;
    const value = row.value;
    if (typeof value !== "string" || isEncryptedFieldValue(value)) {
      skippedEncrypted += 1;
      return;
    }
    if (!dryRun) {
      await db.execute(
        sql`UPDATE ${sql.raw(quotedTable)}
            SET ${sql.raw(quotedColumn)} = ${encryptField(value)}
            WHERE id = ${row.id}`
      );
    }
    encrypted += 1;
  }, Promise.resolve());

  const emptyRows = await executeRows(
    sql`SELECT COUNT(*) AS count FROM ${sql.raw(quotedTable)}
        WHERE ${sql.raw(quotedColumn)} IS NULL OR ${sql.raw(quotedColumn)} = ''`
  );
  const empty = Number(emptyRows[0]?.count ?? 0);

  const mode = dryRun ? "[dry-run] " : "";
  logger.info(
    `${LOG_PREFIX} ${mode}${column.label}: ${encrypted} plaintext value(s) ${dryRun ? "found" : "encrypted"}, ` +
      `${skippedEncrypted} already encrypted (skipped), ${empty} empty/null`,
    { table: column.table, column: column.column }
  );

  return { encrypted, skippedEncrypted, empty };
};

const main = async (): Promise<void> => {
  const { dryRun, help } = parseArgs(process.argv.slice(2));
  if (help) {
    printHelp();
    return;
  }

  if (!process.env.DATABASE_ENCRYPTION_KEY) {
    logger.error(`${LOG_PREFIX} DATABASE_ENCRYPTION_KEY is not set — aborting without changes`);
    process.exitCode = 1;
    return;
  }

  logger.info(`${LOG_PREFIX} starting${dryRun ? " (dry run)" : ""} over ${PII_COLUMNS.length} column(s)`);
  let totalEncrypted = 0;
  let totalSkipped = 0;
  await PII_COLUMNS.reduce(async (chain, column) => {
    await chain;
    const stats = await backfillColumn(column, dryRun);
    totalEncrypted += stats.encrypted;
    totalSkipped += stats.skippedEncrypted;
  }, Promise.resolve());
  logger.info(
    `${LOG_PREFIX} done: ${totalEncrypted} plaintext value(s) ${dryRun ? "pending" : "encrypted"}, ${totalSkipped} already encrypted`
  );
};

main().catch((error: unknown) => {
  logger.error(`${LOG_PREFIX} failed`, { error });
  process.exitCode = 1;
});
