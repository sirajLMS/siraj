/**
 * Labels for the parent payments-ledger page (`/parent/payments`): page
 * chrome, the credit-hours balance metrics strip, and the payments grid/card
 * list columns. Chip/amount formatters are typed functions so each locale
 * controls unit placement.
 */
export interface PaymentsLedgerLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly historySectionTitle: string;
  readonly emptyTitle: string;
  readonly emptySubtitle: string;
  readonly loadError: string;
  readonly balanceSubLabel: string;
  readonly lowBalanceHint: string;
  readonly topUpAction: string;
  readonly hoursRemainingValue: (hours: number) => string;
  readonly hoursAddedChip: (hours: number) => string;
  readonly creditsAddedChip: (credits: number) => string;
  readonly columns: {
    readonly student: string;
    readonly credits: string;
    readonly amount: string;
    readonly packageName: string;
    readonly method: string;
    readonly date: string;
  };
}
