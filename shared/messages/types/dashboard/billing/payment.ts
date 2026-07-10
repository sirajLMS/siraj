export interface PaymentComponentLabels {
  readonly paymentMethodSelector: {
    readonly label: string;
    readonly placeholder: string;
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
