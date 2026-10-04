import { CalculationStatus } from "@/backend/enum";
import {
  formatMinorUnits,
  parseAmountToMinorUnits,
} from "@/backend/services/teacher/payroll-calculation.branch.helpers";
import { DEFAULT_REPORT_CURRENCY } from "@/backend/services/teacher/payroll-calculation.constants";
import type { PayrollReportRow } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

export function buildRowCountByStatus(rows: readonly PayrollReportRow[]): Record<CalculationStatus, number> {
  const counts: Record<CalculationStatus, number> = {
    [CalculationStatus.NOT_CALCULATED]: 0,
    [CalculationStatus.CALCULATED]: 0,
    [CalculationStatus.PARTIALLY]: 0,
    [CalculationStatus.REFUND]: 0,
    [CalculationStatus.WAITING_PAID]: 0,
    [CalculationStatus.PAID]: 0,
  };
  for (const row of rows) {
    counts[row.calculationStatus] += 1;
  }
  return counts;
}

/** Sums paid amounts as exact minor-unit integers — no floating point anywhere. */
export function sumPaidAmounts(rows: readonly PayrollReportRow[]): string {
  let totalMinorUnits = 0n;
  for (const row of rows) {
    if (row.teacherPaidAmount == null) continue;
    const minorUnits = parseAmountToMinorUnits(row.teacherPaidAmount);
    if (minorUnits != null) {
      totalMinorUnits += minorUnits;
    }
  }
  return formatMinorUnits(totalMinorUnits);
}

/** Most frequent currency across rows; ties keep the earliest-seen currency. */
export function pickDominantCurrency(rows: readonly PayrollReportRow[]): CurrencyCode {
  let dominant = DEFAULT_REPORT_CURRENCY;
  let dominantCount = 0;
  const counts = new Map<CurrencyCode, number>();
  for (const row of rows) {
    if (row.teacherPaidCurrency == null) continue;
    const count = (counts.get(row.teacherPaidCurrency) ?? 0) + 1;
    counts.set(row.teacherPaidCurrency, count);
    if (count > dominantCount) {
      dominant = row.teacherPaidCurrency;
      dominantCount = count;
    }
  }
  return dominant;
}
