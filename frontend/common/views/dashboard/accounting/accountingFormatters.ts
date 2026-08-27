import type { InputBaseComponentProps } from "@mui/material";

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
export function formatAccountingDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** Chip color tone for the paid/unpaid status. */
export function paymentStatusTone(isPaid: boolean): "success" | "warning" {
  return isPaid ? "success" : "warning";
}

/** Chip color tone for package plan active/archived. */
export function planActiveTone(active: boolean): "success" | "default" {
  return active ? "success" : "default";
}

/** Numeric input that strips "+eE" chars — keeps numeric fields clean. */
export function positiveNumberInputProps(): Pick<InputBaseComponentProps, "inputMode"> {
  return { inputMode: "decimal" };
}
