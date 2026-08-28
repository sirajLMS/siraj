/** Payment ledger entry — one row per credit purchase/payment transaction. */
export interface PaymentLedgerEntry {
  readonly id: string;
  readonly studentId: string | null;
  readonly studentName: string | null;
  readonly creditsPurchased: number;
  /** Credit hours granted by this payment (hour-package purchases); null when none. */
  readonly creditHours: number | null;
  readonly amount: string;
  readonly currency: string;
  readonly packageName: string | null;
  readonly paymentGateway: string;
  readonly paymentDate: string;
}

/** Paginated payment ledger result. */
export interface PaymentLedgerResult {
  readonly entries: PaymentLedgerEntry[];
  readonly totalCount: number;
}
