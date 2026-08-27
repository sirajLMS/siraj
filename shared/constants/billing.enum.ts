export enum InvoiceStatus {
  UNPAID = "UNPAID",
  PAYMENT_PENDING = "PAYMENT_PENDING",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}

export enum InvoiceType {
  PER_CLASSES = "PER_CLASSES",
  MONTHLY = "MONTHLY",
  MANUAL = "MANUAL",
  CREDIT_HOURS_PACKAGE = "CREDIT_HOURS_PACKAGE",
}

export enum PaymentMethodType {
  MOBILE_WALLET = "MOBILE_WALLET",
  PAYMENT_LINK = "PAYMENT_LINK",
  ONLINE_ACCOUNT = "ONLINE_ACCOUNT",
  BANK_TRANSFER = "BANK_TRANSFER",
  CASH = "CASH",
  PROOF_UPLOAD = "PROOF_UPLOAD",
}

export enum PaymentDirection {
  PAYIN = "PAYIN",
  PAYOUT = "PAYOUT",
  BOTH = "BOTH",
}

/** Gateway through which an accounting (credit-hours) payment was received. */
export enum PaymentGateway {
  NONE = "NONE",
  PAYPAL = "PAYPAL",
  WESTERN_UNION = "WESTERN_UNION",
  BANK = "BANK",
  OTHER = "OTHER",
}

/** Derived (non-persisted) history event kinds for the payment detail timeline. */
export enum AccountingPaymentHistoryKind {
  PAYMENT_RECORDED = "PAYMENT_RECORDED",
  HOURS_CREDITED = "HOURS_CREDITED",
  HOURS_ADJUSTED = "HOURS_ADJUSTED",
  MARKED_PAID = "MARKED_PAID",
}
