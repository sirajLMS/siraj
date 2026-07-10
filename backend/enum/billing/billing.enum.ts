export enum InvoiceStatus {
  UNPAID = "UNPAID",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}

export enum InvoiceType {
  PER_CLASSES = "PER_CLASSES",
  MONTHLY = "MONTHLY",
  MANUAL = "MANUAL",
}

export { PaymentMethod } from "./payment-method.enum";
