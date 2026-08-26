/** Payment ledger entry — one row per credit purchase/payment transaction. */
export interface PaymentLedgerEntry {
  readonly id: string;
  readonly studentId: string | null;
  readonly studentName: string | null;
  readonly creditsPurchased: number;
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
