import type { packagePlans } from "@/backend/db/schema";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Package Plan canonical types.
 * Catalog/config entity — NOT a ledger. Hour/price/currency snapshots are
 * copied onto payment rows at purchase time.
 */

/** Drizzle select type. numeric columns arrive as strings for precision. */
export type PackagePlanSelectType = typeof packagePlans.$inferSelect;

/** Drizzle insert type (creditHours/priceAmount as decimal strings). */
export type PackagePlanInsertType = typeof packagePlans.$inferInsert;

/** Public return shape (alias kept explicit for GraphQL mapping later). */
export type PackagePlanReturnType = PackagePlanSelectType;

export interface PackagePlanSubmitInput {
  codename: string;
  displayName: string;
  description?: string | null;
  creditHours: number;
  priceAmount: number;
  currency: CurrencyCode;
  active?: boolean;
  sortOrder?: number;
  metadata?: Record<string, unknown> | null;
}

export interface PackagePlanUpdateInput {
  id: string;
  displayName?: string;
  description?: string | null;
  creditHours?: number;
  priceAmount?: number;
  currency?: CurrencyCode;
  active?: boolean;
  sortOrder?: number;
  metadata?: Record<string, unknown> | null;
  /** Optimistic-lock guard against concurrent edits. */
  version?: number;
}
