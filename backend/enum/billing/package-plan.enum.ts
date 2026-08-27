/**
 * Accounting (credit-hours payments module) enums.
 */

/** Gateway through which an accounting payment was received. */
export enum PaymentGateway {
  NONE = "NONE",
  PAYPAL = "PAYPAL",
  WESTERN_UNION = "WESTERN_UNION",
  BANK = "BANK",
  OTHER = "OTHER",
}

/**
 * Discriminator for which ledger a class instance bills against.
 * INTENTIONAL v1 SCAFFOLDING: no production code path writes HOUR_CREDIT yet —
 * the writers arrive with Plan 6 (`student.billingMode`). Do not remove.
 */
export enum BilledUnit {
  CLASS_CREDIT = "CLASS_CREDIT",
  HOUR_CREDIT = "HOUR_CREDIT",
}
