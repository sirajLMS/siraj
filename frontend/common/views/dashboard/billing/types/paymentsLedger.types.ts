/**
 * View-layer contracts for the parent payments-ledger page. The ViewModel
 * owns all display shaping (localized dates, chip text, amount strings), so
 * tier views render these fields verbatim.
 */
export interface PaymentsLedgerRow {
  readonly id: string;
  readonly studentId: string | null;
  readonly studentName: string | null;
  /** Credit hours granted by hour-package purchases; null for class-credit rows. */
  readonly creditHours: number | null;
  readonly creditsPurchased: number;
  /** Chip text resolved in the ViewModel (hours padded, or class-credit count). */
  readonly creditsLabel: string;
  /** `${amount} ${currency}` with the numeric part locale-normalized. */
  readonly amountLabel: string;
  readonly packageName: string | null;
  /** Title-cased payment-method type (e.g. "Online Account"). */
  readonly methodLabel: string;
  /** Localized short date (day, month, year) in the viewer's locale. */
  readonly dateLabel: string;
}

/** A distinct child appearing in the ledger; drives the balance metric strip. */
export interface PaymentsLedgerChild {
  readonly studentId: string;
  readonly studentName: string;
}
