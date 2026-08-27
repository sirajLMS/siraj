/**
 * StudentCreditHoursLabels — student profile credit-hours tab labels
 * (balance card, recent purchases, low-balance alert).
 */
export interface StudentCreditHoursLabels {
  readonly tabTitle: string;
  readonly balanceCardTitle: string;
  readonly remainingLabel: string;
  readonly totalLabel: string;
  readonly hoursUnit: (hours: string) => string;
  readonly recentPurchasesTitle: string;
  readonly recentPurchasesEmpty: string;
  readonly lowBalanceAlert: (remaining: string, threshold: string) => string;
  readonly columns: {
    readonly date: string;
    readonly change: string;
    readonly reason: string;
    readonly note: string;
  };
  readonly reasons: {
    readonly PURCHASE: string;
    readonly DEDUCTION: string;
    readonly REFUND: string;
    readonly ADJUSTMENT: string;
  };
  readonly perAudience: {
    readonly studentHint: string;
    readonly parentHint: string;
    readonly teacherHint: string;
    readonly supervisorHint: string;
  };
  readonly nextClassConsumes: (hours: string) => string;
  readonly loadError: string;
}
