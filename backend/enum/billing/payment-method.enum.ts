export enum PaymentMethodType {
  MOBILE_WALLET = "MOBILE_WALLET",
  PAYMENT_LINK = "PAYMENT_LINK",
  ONLINE_ACCOUNT = "ONLINE_ACCOUNT",
  BANK_TRANSFER = "BANK_TRANSFER",
  CASH = "CASH",
}

export enum PaymentDirection {
  PAYIN = "PAYIN",
  PAYOUT = "PAYOUT",
  BOTH = "BOTH",
}

export enum IdentifierKind {
  EMAIL = "EMAIL",
  HANDLE = "HANDLE",
  EMAIL_OR_HANDLE = "EMAIL_OR_HANDLE",
}
