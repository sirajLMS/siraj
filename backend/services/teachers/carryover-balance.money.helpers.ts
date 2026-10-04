import {
  FX_RATE_HALF_SCALE,
  FX_RATE_SCALE,
  MINOR_UNITS_BASE,
} from "@/backend/services/teachers/carryover-balance.constants";

/** Parses a two-decimal amount string into integer minor units; null when malformed. */
export function toAmountMinorUnits(amount: string): bigint | null {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(amount.trim());
  if (!match) return null;
  const digits = match[2];
  const fraction = match[3];
  if (digits == null) return null;
  const units = BigInt(digits) * MINOR_UNITS_BASE + BigInt((fraction ?? "").padEnd(2, "0"));
  return match[1] === "-" ? -units : units;
}

/** Renders minor units back into the canonical two-decimal amount string. */
export function formatAmountMinorUnits(units: bigint): string {
  const sign = units < 0n ? "-" : "";
  const absolute = units < 0n ? -units : units;
  const remainder = `${absolute % MINOR_UNITS_BASE}`.padStart(2, "0");
  return `${sign}${absolute / MINOR_UNITS_BASE}.${remainder}`;
}

/** Sums decimal-string amounts as exact integer minor units. */
export function sumAmounts(amounts: readonly string[]): string {
  return formatAmountMinorUnits(amounts.reduce((total, amount) => total + (toAmountMinorUnits(amount) ?? 0n), 0n));
}

/** Multiplies a two-decimal amount by an FX rate string (up to 6 fractional digits), rounding half-up. */
export function convertAmountWithRate(amount: string, rate: string): string | null {
  const units = toAmountMinorUnits(amount);
  const rateMatch = /^(\d+)(?:\.(\d{1,6}))?$/.exec(rate.trim());
  const rateDigits = rateMatch?.[1];
  if (units == null || rateDigits == null) return null;
  const scaledRate = BigInt(rateDigits) * FX_RATE_SCALE + BigInt((rateMatch?.[2] ?? "").padEnd(6, "0"));
  return formatAmountMinorUnits((units * scaledRate + FX_RATE_HALF_SCALE) / FX_RATE_SCALE);
}
