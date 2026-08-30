export interface CreditAdjustmentLabels {
  readonly title: string;
  readonly adjustCredits: string;
  readonly adjustmentType: {
    readonly title: string;
    readonly add: string;
    readonly subtract: string;
    readonly subtractWithCarryover: string;
  };
  readonly carryover: {
    readonly bannerTitle: string;
    readonly teacher: string;
    readonly fromDate: string;
    readonly toDate: string;
    readonly paymentDate: string;
  };
  readonly reason: { readonly label: string };
  readonly hours: { readonly label: string };
  readonly form: {
    /** Caption for the selected-student balance chip (`remaining / total`). */
    readonly balance: string;
  };
  /** Hint shown when a server-capped directory search returns exactly the fetch limit. */
  readonly resultsCappedHint: (limit: number) => string;
  readonly validation: {
    readonly fromAfterTo: string;
    readonly paymentTooFar: string;
    readonly insufficientClasses: string;
    readonly hoursPositive: string;
  };
  readonly success: {
    readonly added: (hours: number) => string;
    readonly subtracted: (hours: number) => string;
    readonly carryover: (hours: number, teacher: string) => string;
  };
}
