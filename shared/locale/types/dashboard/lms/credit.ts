export interface CreditLabels {
  readonly title: string;
  readonly balance: string;
  readonly purchase: string;
  readonly deduction: string;
  readonly refund: string;
  readonly adjustment: string;
  readonly transactionsHistory: string;
  readonly hoursRemaining: string;
  readonly hoursTotal: string;
  readonly recordPurchase: string;
  readonly purchaseSuccess: (hours: number) => string;
  readonly insufficientCredits: (remaining: number) => string;
}
