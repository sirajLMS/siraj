import type { CalculationStatus } from "@/backend/enum";
import type { PothosObjectFieldBuilder } from "@/backend/graphql/pothos/shared/builder-types";
import { CalculationStatusPothosEnum, CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Structural shape of the payroll calculation snapshot columns shared by the
 * session audit report row and the class instance detail object: null until a
 * payroll calculation has run for the instance.
 */
export interface PayrollSnapshotFieldShape {
  readonly calculatedDuration: number | null;
  readonly teacherPaidAmount: string | null;
  readonly teacherPaidCurrency: CurrencyCode | null;
  readonly calculationStatus: CalculationStatus | null;
  readonly isPartialPercentage: number | null;
  readonly payrollNote: string | null;
  readonly payrollCalculatedAt: Date | string | null;
}

/**
 * Payroll snapshot field definitions (calculated duration, paid amount and
 * currency, calculation status, partial-percentage share, note, and
 * calculated-at timestamp) shared by every object that surfaces the snapshot.
 * Callers spread the result alongside their own type-specific fields.
 */
export function payrollSnapshotFields<Shape extends PayrollSnapshotFieldShape>(t: PothosObjectFieldBuilder<Shape>) {
  return {
    calculatedDuration: t.field({ type: "Int", nullable: true, resolve: row => row.calculatedDuration }),
    teacherPaidAmount: t.field({ type: "String", nullable: true, resolve: row => row.teacherPaidAmount }),
    teacherPaidCurrency: t.field({
      type: CurrencyCodePothosObject,
      nullable: true,
      resolve: row => row.teacherPaidCurrency,
    }),
    calculationStatus: t.field({
      type: CalculationStatusPothosEnum,
      nullable: true,
      resolve: row => row.calculationStatus,
    }),
    isPartialPercentage: t.field({ type: "Int", nullable: true, resolve: row => row.isPartialPercentage }),
    payrollNote: t.field({ type: "String", nullable: true, resolve: row => row.payrollNote }),
    payrollCalculatedAt: t.field({ type: "DateTime", nullable: true, resolve: row => row.payrollCalculatedAt }),
  };
}
