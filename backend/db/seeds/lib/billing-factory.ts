import { InvoiceStatus, InvoiceType, PaymentMethod } from "@/backend/enum";
import { addMonths, formatDateKey, getDateWindow, startOfDay } from "./date-window";
import { getFakerForIndex } from "./faker-client";
import type { SeedConfig } from "./seed-config";

export interface InvoiceMonthSpec {
  year: number;
  month: number;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  status: InvoiceStatus;
}

export function* iterateInvoiceMonths(config: SeedConfig): Generator<InvoiceMonthSpec> {
  const { start, end } = getDateWindow(config.anchorDate, config.monthsBefore, config.monthsAfter);
  let current = startOfDay(start);
  current.setDate(1);

  while (current <= end) {
    const year = current.getFullYear();
    const month = current.getMonth() + 1;
    const issueDate = formatDateKey(current);
    const due = new Date(current);
    due.setDate(15);
    const dueDate = formatDateKey(due);
    const isPast = startOfDay(current) < startOfDay(config.anchorDate);
    const status = isPast && month % 2 === 0 ? InvoiceStatus.PAID : InvoiceStatus.UNPAID;
    const paidDate = status === InvoiceStatus.PAID ? dueDate : null;

    yield { year, month, issueDate, dueDate, paidDate, status };
    current = addMonths(current, 1);
  }
}

export function buildInvoiceAmount(config: SeedConfig, parentIndex: number, monthKey: string): string {
  const faker = getFakerForIndex(config.fakerSeed, parentIndex + monthKey.length);
  return faker.number.int({ min: 80, max: 400 }).toFixed(2);
}

export const DEFAULT_INVOICE_CURRENCY = "USD";
export const DEFAULT_INVOICE_TYPE = InvoiceType.MONTHLY;
export const DEFAULT_PAYMENT_METHOD = PaymentMethod.PAYPAL;

export const EXCHANGE_PAIRS = [
  { from: "USD", to: "EGP", baseRate: "48.500000" },
  { from: "USD", to: "SAR", baseRate: "3.750000" },
  { from: "EGP", to: "USD", baseRate: "0.020619" },
] as const;
