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
