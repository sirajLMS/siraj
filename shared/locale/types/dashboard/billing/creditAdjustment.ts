export interface CreditAdjustmentLabels {
  readonly title: string;
  readonly adjustCredits: string;
  readonly adjustmentType: {
    readonly title: string;
    readonly add: string;
    readonly subtract: string;
    readonly subtractWithCarryover: string;
    readonly addDescription: string;
    readonly subtractDescription: string;
    readonly subtractWithCarryoverDescription: string;
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
    /** Label for the staff-only plain-text operator note field. */
    readonly internalNotes: string;
    /** Helper text clarifying the audience of the internal note. */
    readonly internalNotesHint: string;
  };
  /** Live preview of the resulting balance while the operator types hours. */
  readonly preview: {
    readonly balance: (from: number, to: number) => string;
  };
  /** Pre-submit summary strip describing the pending operation in words. */
  readonly summary: {
    readonly add: (hours: number, student: string) => string;
    readonly subtract: (hours: number, student: string) => string;
    readonly carryover: (hours: number, teacher: string, paymentDate: string) => string;
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
