import { eq, or, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";

/**
 * Builds a `direction` filter clause for a `supportedDirections` column.
 *
 * Matches rows whose `supportedDirections` value equals the supplied
 * direction OR `PaymentDirection.BOTH`. Returns `undefined` when no
 * direction is supplied so callers can `.filter(Boolean)` on a conditions
 * array.
 *
 * Extracted from `supported-mobile-wallet`, `supported-online-account`,
 * and `supported-payment-link` repositories to eliminate 3 copies of the
 * same `or(eq(...), eq(..., "BOTH"))` snippet.
 */
export function directionFilter(directionColumn: PgColumn, direction?: PaymentDirection): SQL | undefined {
  if (!direction) return undefined;
  return or(eq(directionColumn, direction), eq(directionColumn, PaymentDirection.BOTH));
}
