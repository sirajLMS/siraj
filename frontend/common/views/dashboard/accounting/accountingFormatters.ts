import { PaymentGateway } from "@/frontend/common/graphql/generated/gql/graphql";
import type { PaymentsLabels } from "@/shared/locale/types/dashboard/accounting/payments";

/**
 * Shared formatting helpers for the accounting views (payments + packages).
 * Pure functions — no MUI/theme coupling — so both desktop and mobile views
 * (and any future shared components) can reuse them.
 */

/** "25000.00" → "25,000.00" (grouped, no currency symbol — currency renders beside). */
export function formatAccountingMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(numeric)) return String(value);
  return numeric.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** ISO DateTime / date → localized short date (locale-safe for AR via Intl). */
/** Grid-safe numeric coercion — MUI hands columns untyped `unknown` cells. */
export function numericCell(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/** Grid-safe text coercion with a localized-ready fallback. */
export function textCell(value: unknown, fallback = "—"): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

/** Grid-safe date coercion for the shared accounting date formatter. */
export function dateCell(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return null;
}

/**
 * Maps the app locale to an Intl tag for accounting dates. Bare "ar" keeps the
 * Gregorian calendar (matching the dates printed on invoice PDFs) while
 * rendering Arabic month names; other locales fall back to "en".
 */
function resolveAccountingDateLocale(locale: string): string {
  return locale.startsWith("ar") ? "ar" : "en";
}

export function formatAccountingDate(value: string | null | undefined, locale: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(resolveAccountingDateLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Chip color tone for the paid/unpaid status. */
export function paymentStatusTone(isPaid: boolean): "success" | "warning" {
  return isPaid ? "success" : "warning";
}

/** Chip color tone for package plan active/archived. */
export function planActiveTone(active: boolean): "success" | "default" {
  return active ? "success" : "default";
}

/**
 * Payment-gateway label for detail surfaces: payments recorded without a
 * gateway (null or the NONE member) render the shared muted dash, matching the
 * other empty-value fallbacks instead of spelling out "None".
 */
export function paymentGatewayLabel(
  gateway: PaymentGateway | null | undefined,
  gateways: PaymentsLabels["gateways"]
): string {
  if (!gateway || gateway === PaymentGateway.None) return "—";
  return gateways[gateway];
}
