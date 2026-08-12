import { and, eq, inArray, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { queryDb } from "@/backend/db";
import { db } from "@/backend/db/drizzleDb";
import { directionFilter } from "@/backend/db/repo/billing/__shared__/directionFilter";
import { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import type { DBTransaction } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

// ---- Shared row shape -------------------------------------------------------

/**
 * Shared shape that all "supported" billing table rows provide.
 * Repositories built by {@link makeBillingRepo} must operate on a table
 * whose inferred select satisfies this interface.
 */
export interface BillingRow {
  readonly id: string;
  readonly slug: string;
  readonly isActive: boolean;
  readonly supportedDirections: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ---- Column references -------------------------------------------------------

/**
 * Typed Drizzle column references from the table definition.
 * Using `PgColumn` ensures compatibility with `eq()`, `orderBy()`, etc.
 */
export interface BillingTableShape {
  /** The Drizzle table (used for select / insert / update / from). */
  readonly table: PgTable;
  /** The `id` column. */
  readonly id: PgColumn;
  /** The `slug` column (used for `getBySlug` + `orderBy`). */
  readonly slug: PgColumn;
  /** The `isActive` column (used in `listActive` + `deactivate`). */
  readonly isActive: PgColumn;
  /** The `supportedDirections` column (used in `directionFilter`). */
  readonly supportedDirections: PgColumn;
}

// ---- Config ------------------------------------------------------------------

/**
 * Configuration object consumed by {@link makeBillingRepo}.
 *
 * @template TRow - Inferred select row shape (must satisfy {@link BillingRow}).
 * @template TSelect - Canonical `*SelectType` produced by `toSelectType`.
 * @template TInsert - Canonical `*InsertType` consumed by `create`.
 * @template TUpdateInput - Canonical `Update*Input` type for `update` / `deactivate`.
 * @template TFilters - Extra filters consumed by `listActive`.
 */
export interface BillingRepoConfig<TRow extends BillingRow, TSelect, TInsert, TUpdateInput, TFilters> {
  /** Column references + the Drizzle table. */
  readonly shape: BillingTableShape;
  /** Schema table name used for localized error messages. */
  readonly tableName: string;
  /** Maps a raw DB row to the canonical `*SelectType` used downstream. */
  readonly toSelectType: (row: TRow) => TSelect;
  /** Partial input passed to `update()` when `deactivate()` is called. */
  readonly deactivateInput: TUpdateInput;
  /**
   * Optional extra conditions appended to `listActive`.
   *
   * Returns `undefined` to add no condition.
   */
  readonly extraActiveFilters?: (filters: TFilters) => SQL | undefined;
  /**
   * Optional hook to prepare/normalize the insert payload before `create()`
   * writes it. Use this to restore entity-specific defaults that were
   * applied in the original per-repo `create` (e.g. `identifierLabel`).
   *
   * The hook receives the original `input` and MUST return a value
   * assignable to `TInsert`. It is called BEFORE the factory adds
   * `createdAt`/`updatedAt` defaults.
   */
  readonly prepareInsert?: (input: TInsert) => TInsert;
}

// ---- Output method bag -------------------------------------------------------

/**
 * Shared CRUD + query methods produced by {@link makeBillingRepo}.
 */
export interface BillingRepoMethods<TSelect, TInsert, TUpdateInput, TFilters> {
  listAll: (tx?: DBTransaction) => Promise<TSelect[]>;
  listActive: (filters?: TFilters, tx?: DBTransaction) => Promise<TSelect[]>;
  getById: (id: string, tx?: DBTransaction) => Promise<TSelect | null>;
  getBySlug: (slug: string, tx?: DBTransaction) => Promise<TSelect | null>;
  create: (input: TInsert, tx?: DBTransaction) => Promise<TSelect>;
  update: (id: string, input: TUpdateInput, tErrors: ErrorsLabels, tx?: DBTransaction) => Promise<TSelect>;
  deactivate: (id: string, tErrors: ErrorsLabels, tx?: DBTransaction) => Promise<TSelect>;
  listByIds: (ids: readonly string[], tx?: DBTransaction) => Promise<TSelect[]>;
}

// ---- Factory -----------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getDirectionFilter(filters: unknown): PaymentDirection | undefined {
  if (isRecord(filters) && "direction" in filters) {
    const d = filters.direction;
    if (typeof d === "string") {
      const match = Object.values(PaymentDirection).find(v => (v as string) === d);
      if (match) return match;
    }
  }
  return undefined;
}

/**
 * Type guard: extracts `createdAt` or `updatedAt` from an unknown input.
 */
function getDateField(value: unknown, field: string): Date | undefined {
  if (isRecord(value)) {
    const v = value[field];
    if (v instanceof Date) return v;
  }
  return undefined;
}

/**
 * Factory that builds the shared billing CRUD method bag for a single
 * "supported-*" table. Each repository calls this once at module scope,
 * spreads the result into its namespace, then appends entity-specific
 * methods like `upsertMany`.
 *
 * Eliminates the cross-file duplication that existed across
 * `supported-mobile-wallet`, `supported-online-account`, and
 * `supported-payment-link` repositories (8 identical methods per file).
 */
export function makeBillingRepo<
  TRow extends BillingRow,
  TSelect,
  TInsert,
  TUpdateInput,
  TFilters extends Record<string, unknown> = Record<string, unknown>,
>(
  config: BillingRepoConfig<TRow, TSelect, TInsert, TUpdateInput, TFilters>
): BillingRepoMethods<TSelect, TInsert, TUpdateInput, TFilters> {
  const { shape, tableName, toSelectType, deactivateInput, extraActiveFilters, prepareInsert } = config;
  const { table, id, slug, isActive, supportedDirections } = shape;

  function isBillingRow(value: unknown): value is TRow {
    return isRecord(value);
  }

  function validateRow(row: unknown): TRow {
    if (isBillingRow(row)) return row;
    throw new Error("Invalid row shape from database query");
  }

  async function listAll(tx?: DBTransaction): Promise<TSelect[]> {
    const client = queryDb(tx);
    return client
      .select()
      .from(table)
      .orderBy(slug)
      .then((rows: unknown[]) => rows.map(r => toSelectType(validateRow(r))));
  }

  async function listActive(filters?: TFilters, tx?: DBTransaction): Promise<TSelect[]> {
    const client = queryDb(tx);
    const directionRaw = getDirectionFilter(filters);
    const conditions: (SQL | undefined)[] = [eq(isActive, true), directionFilter(supportedDirections, directionRaw)];
    if (extraActiveFilters && filters) {
      conditions.push(extraActiveFilters(filters));
    }

    return client
      .select()
      .from(table)
      .where(conditions.length > 0 ? and(...conditions.filter(Boolean)) : undefined)
      .orderBy(slug)
      .then((rows: unknown[]) => rows.map(r => toSelectType(validateRow(r))));
  }

  async function getById(idValue: string, tx?: DBTransaction): Promise<TSelect | null> {
    const client = queryDb(tx);
    const [row] = await client.select().from(table).where(eq(id, idValue)).limit(1);
    return row ? toSelectType(validateRow(row)) : null;
  }

  async function getBySlug(slugValue: string, tx?: DBTransaction): Promise<TSelect | null> {
    const client = queryDb(tx);
    const [row] = await client.select().from(table).where(eq(slug, slugValue)).limit(1);
    return row ? toSelectType(validateRow(row)) : null;
  }

  async function create(input: TInsert, tx?: DBTransaction): Promise<TSelect> {
    const client = tx ?? db;
    const now = new Date();
    const prepared = prepareInsert ? prepareInsert(input) : input;
    const [created] = await client
      .insert(table)
      .values({
        ...prepared,
        createdAt: getDateField(prepared, "createdAt") ?? now,
        updatedAt: getDateField(prepared, "updatedAt") ?? now,
      })
      .returning();

    if (!created) {
      throw new Error(`Failed to create ${tableName} row`);
    }

    return toSelectType(validateRow(created));
  }

  async function applyUpdate(
    idValue: string,
    setValues: TUpdateInput,
    tErrors: ErrorsLabels,
    tx: DBTransaction | undefined
  ): Promise<TSelect> {
    const [updated] = await (tx ?? db)
      .update(table)
      .set({ ...setValues, updatedAt: new Date() })
      .where(eq(id, idValue))
      .returning();

    if (!updated) {
      throw new Error(tErrors.file.recordNotFound({ tableName, entityId: idValue }));
    }

    return toSelectType(validateRow(updated));
  }

  async function update(
    idValue: string,
    input: TUpdateInput,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<TSelect> {
    return applyUpdate(idValue, input, tErrors, tx);
  }

  async function deactivate(idValue: string, tErrors: ErrorsLabels, tx?: DBTransaction): Promise<TSelect> {
    return applyUpdate(idValue, deactivateInput, tErrors, tx);
  }

  async function listByIds(ids: readonly string[], tx?: DBTransaction): Promise<TSelect[]> {
    if (ids.length === 0) return [];
    const client = queryDb(tx);
    return client
      .select()
      .from(table)
      .where(inArray(id, [...ids]))
      .then((rows: unknown[]) => rows.map(r => toSelectType(validateRow(r))));
  }

  return {
    listAll,
    listActive,
    getById,
    getBySlug,
    create,
    update,
    deactivate,
    listByIds,
  };
}

// ---- Upsert Many Factory -----------------------------------------------------

/**
 * Builds the insert values payload for a single upsert row.
 * Receives the input and `now` (shared timestamp) — returns the
 * entity-specific record to pass to `.values()`.
 */
export type BuildUpsertInsert<TInsert> = (input: TInsert, now: Date) => Record<string, unknown>;

/**
 * Builds the on-conflict update set for a single upsert row.
 * Receives the input and `now` — returns the entity-specific
 * partial record to pass to `.onConflictDoUpdate({ set })`.
 */
export type BuildUpsertConflictSet<TInsert> = (input: TInsert, now: Date) => Record<string, unknown>;

/**
 * Common upsert fields shared by all supported-* billing entities
 * (mobile-wallet, online-account, payment-link).
 *
 * Both the insert and conflict-set payloads repeat the same default
 * assignments for `description`, `instructions`, `supportedDirections`,
 * `logoUrl`, and `isActive`. Extracting them here eliminates the jscpd
 * clone that spans the three repository files.
 */
interface CommonUpsertInput {
  readonly name: unknown;
  readonly description?: unknown;
  readonly instructions?: unknown;
  readonly supportedDirections?: string;
  readonly logoUrl?: unknown;
  readonly isActive?: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

/**
 * Shared field assignments used by both insert and conflict-set payloads.
 * Extracted to eliminate the jscpd clone between the two functions below.
 */
function buildCommonUpsertFields(input: CommonUpsertInput): Record<string, unknown> {
  return {
    description: input.description ?? null,
    instructions: input.instructions ?? null,
    supportedDirections: input.supportedDirections ?? "BOTH",
    logoUrl: input.logoUrl ?? null,
    isActive: input.isActive ?? true,
  };
}

/**
 * Returns the common insert fields (excluding `slug` which is the conflict
 * target and entity-specific fields).
 */
export function buildCommonInsertFields(input: CommonUpsertInput, now: Date): Record<string, unknown> {
  return {
    ...buildCommonUpsertFields(input),
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
}

/**
 * Returns the common conflict-set fields (the `onConflictDoUpdate` update
 * payload excluding entity-specific fields).
 */
export function buildCommonConflictFields(input: CommonUpsertInput, now: Date): Record<string, unknown> {
  return {
    ...buildCommonUpsertFields(input),
    updatedAt: now,
  };
}

/**
 * Configuration for {@link makeBillingUpsertMany}.
 *
 * @template TRow - Inferred select row shape
 * @template TSelect - Canonical `*SelectType`
 * @template TInsert - Canonical `*InsertType`
 */
export interface BillingUpsertConfig<TRow extends BillingRow, TSelect, TInsert> {
  /** The Drizzle table to insert into. */
  readonly table: PgTable;
  /** The `slug` column (conflict target). */
  readonly slug: PgColumn;
  /** Maps a raw DB row to the canonical `*SelectType`. */
  readonly toSelectType: (row: TRow) => TSelect;
  /** Builds the insert values payload for a single row. */
  readonly buildInsert: BuildUpsertInsert<TInsert>;
  /** Builds the on-conflict update set for a single row. */
  readonly buildConflictSet: BuildUpsertConflictSet<TInsert>;
}

/**
 * Factory that builds a shared `upsertMany` method for billing repositories.
 *
 * Eliminates the duplicated control flow across `supported-mobile-wallet`,
 * `supported-online-account`, and `supported-payment-link` repositories:
 * empty check, transaction wrapping, recursive sequential insert+onConflictDoUpdate,
 * `toSelectType` mapping, and `tx ?? db.transaction` delegation.
 *
 * Each repo provides entity-specific `buildInsert` and `buildConflictSet`
 * callbacks that produce the per-row insert/conflict payloads.
 */
export function makeBillingUpsertMany<TRow extends BillingRow, TSelect, TInsert>(
  config: BillingUpsertConfig<TRow, TSelect, TInsert>
) {
  const { table, slug, toSelectType, buildInsert, buildConflictSet } = config;

  function isUpsertRow(value: unknown): value is TRow {
    return isRecord(value);
  }

  function validateUpsertRow(row: unknown): TRow {
    if (isUpsertRow(row)) return row;
    throw new Error("Invalid row shape from database upsert");
  }

  async function upsertOne(t: DBTransaction, input: TInsert, now: Date): Promise<TSelect | null> {
    const [row] = await t
      .insert(table)
      .values(buildInsert(input, now))
      .onConflictDoUpdate({
        target: slug,
        set: buildConflictSet(input, now),
      })
      .returning();

    if (!row) return null;
    return toSelectType(validateUpsertRow(row));
  }

  async function processNext(
    t: DBTransaction,
    inputs: readonly TInsert[],
    index: number,
    acc: TSelect[],
    now: Date
  ): Promise<TSelect[]> {
    if (index >= inputs.length) return acc;
    const result = await upsertOne(t, inputs[index], now);
    if (result) acc.push(result);
    return processNext(t, inputs, index + 1, acc, now);
  }

  async function upsertMany(inputs: readonly TInsert[], tx?: DBTransaction): Promise<TSelect[]> {
    if (inputs.length === 0) return [];

    const run = async (t: DBTransaction): Promise<TSelect[]> => {
      const now = new Date();
      return processNext(t, inputs, 0, [], now);
    };

    if (tx) {
      return run(tx);
    }
    return db.transaction(run);
  }

  return upsertMany;
}
