import { PaymentGateway } from "@/frontend/common/graphql/generated/gql/graphql";
import type { PaymentsLabels } from "@/shared/locale/types/dashboard/accounting/payments";

/**
 * Shared formatting helpers for the accounting views (payments + packages).
 * Pure functions — no MUI/theme coupling — so both desktop and mobile views
 * (and any future shared components) can reuse them.
 */

/** Cached `Intl.NumberFormat` instance for money formatting to prevent instantiation overhead during grid rendering. */
const moneyNumberFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "25000.00" → "25,000.00" (grouped, no currency symbol — currency renders beside). */
export function formatAccountingMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(numeric)) return String(value);
  return moneyNumberFormat.format(numeric);
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

/** Cache `Intl.DateTimeFormat` instances per resolved locale to avoid instantiation overhead during grid rendering. */
const accountingDateDtfCache = new Map<string, Intl.DateTimeFormat>();

function getAccountingDateDtf(locale: string): Intl.DateTimeFormat {
  const tag = resolveAccountingDateLocale(locale);
  let dtf = accountingDateDtfCache.get(tag);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat(tag, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    accountingDateDtfCache.set(tag, dtf);
  }
  return dtf;
}

export function formatAccountingDate(value: string | null | undefined, locale: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return getAccountingDateDtf(locale).format(date);
}

/** Cache `Intl.DateTimeFormat` instances per resolved locale for accounting month formatting. */
const accountingMonthDtfCache = new Map<string, Intl.DateTimeFormat>();

function getAccountingMonthDtf(locale: string): Intl.DateTimeFormat {
  const tag = resolveAccountingDateLocale(locale);
  let dtf = accountingMonthDtfCache.get(tag);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat(tag, {
      month: "short",
      year: "numeric",
    });
    accountingMonthDtfCache.set(tag, dtf);
  }
  return dtf;
}

/**
 * Accounting-month wire string (`YYYY-MM`) → localized month-year label
 * (e.g. "Sep 2026"); Arabic renders Arabic month names and digits. The date is
 * built in local time so the formatted month never rolls back across midnights.
 */
export function formatAccountingMonth(value: string | null | undefined, locale: string): string {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  const date = match === null ? null : new Date(Number(match[1]), Number(match[2]) - 1, 1);
  if (date === null || Number.isNaN(date.getTime())) return value;
  return getAccountingMonthDtf(locale).format(date);
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
