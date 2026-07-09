export interface PaymentComponentLabels {
  readonly paymentMethodSelector: {
    readonly bank_account: string;
    readonly paypal: string;
    readonly label: string;
  };
  readonly paymentStatusBadge: {
    readonly paid: string;
    readonly pending: string;
    readonly unpaid: string;
    readonly overdue: string;
    readonly cancelled: string;
    readonly refunded: string;
  };
  readonly paymentSummaryCard: {
    readonly amount: string;
    readonly date: string;
    readonly paymentMethod: string;
  };
}