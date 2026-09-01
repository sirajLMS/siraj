import type { packagePlans } from "@/backend/db/schema";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Package Plan canonical types.
 * Catalog/config entity — NOT a ledger. Hour/price/currency snapshots are
 * copied onto payment rows at purchase time.
 */

/** Drizzle select type. numeric columns arrive as strings for precision. */
export type PackagePlanSelectType = typeof packagePlans.$inferSelect;

export interface PackagePlanSubmitInput {
  codename: string;
  displayName: string;
  description?: string | null;
  creditHours: number;
  priceAmount: number;
  currency: CurrencyCode;
  /** Optional purchase validity window in months. */
  validityMonths?: number | null;
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
  validityMonths?: number | null;
  active?: boolean;
  sortOrder?: number;
  metadata?: Record<string, unknown> | null;
  /** Optimistic-lock guard against concurrent edits. */
  version?: number;
}
