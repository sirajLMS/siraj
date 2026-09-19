import { createHash } from "node:crypto";
import { and, asc, eq, sql } from "drizzle-orm";
import { queryDb, queryWithPagination } from "@/backend/db";
import { packagePlans } from "@/backend/db/schema";
import { DomainError } from "@/backend/lib/errors";
import type * as Types from "@/backend/types";
import type { DBTransaction, PaginationArgs } from "@/backend/types";

export namespace PackagePlanRepository {
  export const create = async (
    tx: DBTransaction,
    input: {
      codename: string;
      displayName: string;
      description?: string | null;
      creditHours: string;
      priceAmount: string;
      currency: Types.PackagePlanSelectType["currency"];
      validityMonths?: number | null;
      active?: boolean;
      sortOrder?: number;
      metadata?: Record<string, unknown> | null;
    }
  ): Promise<Types.PackagePlanSelectType> => {
    const now = new Date();
    const [row] = await tx
      .insert(packagePlans)
      .values({
        codename: input.codename,
        displayName: input.displayName,
        description: input.description ?? null,
        creditHours: input.creditHours,
        priceAmount: input.priceAmount,
        currency: input.currency,
        validityMonths: input.validityMonths ?? null,
        active: input.active ?? true,
        sortOrder: input.sortOrder ?? 0,
        metadata: input.metadata ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!row) throw new DomainError("PACKAGE_PLAN_INSERT_FAILED", "package plan insert returned no rows");
    return row;
  };

  export const findById = async (id: string, tx?: DBTransaction): Promise<Types.PackagePlanSelectType | null> => {
    const q = queryDb(tx);
    const [row] = await q.select().from(packagePlans).where(eq(packagePlans.id, id)).limit(1);
    return row ?? null;
  };

  /** Case-insensitive lookup (service dedupes PLAN_A vs plan_a with this). */
  export const findByCodename = async (
    codename: string,
    tx?: DBTransaction
  ): Promise<Types.PackagePlanSelectType | null> => {
    const q = queryDb(tx);
    const [row] = await q
      .select()
      .from(packagePlans)
      .where(sql`lower(${packagePlans.codename}) = ${codename.toLowerCase()}`)
      .limit(1);
    return row ?? null;
  };

  export const listActive = async (tx?: DBTransaction): Promise<Types.PackagePlanSelectType[]> => {
    const q = queryDb(tx);
    return q
      .select()
      .from(packagePlans)
      .where(and(eq(packagePlans.active, true), sql`${packagePlans.deletedAt} IS NULL`))
      .orderBy(asc(packagePlans.sortOrder), asc(packagePlans.displayName));
  };

  export const listAllPaginated = async (
    paginationArgs: PaginationArgs | null,
    tx?: DBTransaction
  ): Promise<Types.PackagePlanSelectType[]> => {
    const q = queryDb(tx);
    const baseQuery = q
      .select()
      .from(packagePlans)
      .orderBy(asc(packagePlans.sortOrder), asc(packagePlans.displayName))
      .$dynamic();
    return queryWithPagination(baseQuery, paginationArgs);
  };

  /** Snapshot-friendly update: returns the fresh row; optimistic lock via version. */
  export const update = async (
    tx: DBTransaction,
    id: string,
    patch: {
      displayName?: string;
      description?: string | null;
      creditHours?: string;
      priceAmount?: string;
      currency?: Types.PackagePlanSelectType["currency"];
      validityMonths?: number | null;
      active?: boolean;
      sortOrder?: number;
      metadata?: Record<string, unknown> | null;
    },
    expectedVersion?: number
  ): Promise<Types.PackagePlanSelectType | null> => {
    const current = await findById(id, tx);
    if (!current) return null;
    if (expectedVersion !== undefined && current.version !== expectedVersion) {
      // Mirrors the adjustClassesQuota optimistic-lock style in student.repository.
      throw new Error(`package plan version mismatch for ${id}: expected ${expectedVersion}, got ${current.version}`);
    }
    const [row] = await tx
      .update(packagePlans)
      // Self-increment drives the optimistic-lock contract: every guarded
      // write must invalidate stale expectedVersion snapshots.
      .set({
        ...patch,
        version: (current.version ?? 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(packagePlans.id, id))
      .returning();
    return row ?? null;
  };

  /** Soft-archive: row stays queryable for past payments, hidden from catalogs. */
  export const archive = async (tx: DBTransaction, id: string): Promise<Types.PackagePlanSelectType | null> => {
    const [row] = await tx
      .update(packagePlans)
      .set({ active: false, deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(packagePlans.id, id))
      .returning();
    return row ?? null;
  };

  /** Deterministic SHA-256 key over the plan definition snapshot fields. */
  export const generateIdempotencyKey = (input: {
    codename: string;
    displayName: string;
    creditHours: number | string;
    priceAmount: number | string;
    currency: string;
  }): string => {
    const content = JSON.stringify([
      input.codename.toLowerCase(),
      input.displayName,
      String(input.creditHours),
      String(input.priceAmount),
      input.currency,
    ]);
    return `pkgplan-${createHash("sha256").update(content).digest("hex")}`;
  };
}
