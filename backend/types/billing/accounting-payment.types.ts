import type { payments } from "@/backend/db/schema";
import type { PaymentGateway } from "@/backend/enum";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Accounting (credit-hours) payment canonical types.
 *
 * R2 SE note: numeric fields are `string` in select-shaped types (Drizzle
 * numeric arrives as string for precision preservation) but `number` in the
 * Submit/Update inputs — the service layer converts via String()/Number().
 */

/** Drizzle row shape for the underlying payments row. */
export type AccountingPaymentSelectType = typeof payments.$inferSelect;

export interface AccountingPaymentFilter {
  studentId?: string;
  parentId?: string;
  /** ISO date string (YYYY-MM-DD), inclusive lower bound on paymentDate. */
  fromDate?: string;
  /** ISO date string (YYYY-MM-DD), inclusive upper bound on paymentDate. */
  toDate?: string;
  unpaidOnly?: boolean;
}

export interface AccountingPaymentSubmitInput {
  studentId: string;
  /** Null = ad-hoc payment without a package plan (EC-18). */
  packagePlanId?: string | null;
  creditHours: number;
  amount: number;
  currency: CurrencyCode;
  paymentGateway: PaymentGateway;
  paymentDate: Date;
  isPaidStatusOn?: boolean;
  paymentNote?: string | null;
  /** Actor that recorded the payment — invoice createdByUserId. */
  actorUserId?: string;
}

export interface AccountingPaymentUpdateInput {
  id: string;
  paymentGateway?: PaymentGateway;
  paymentNote?: string | null;
  /**
   * When set AND different from the stored value, an ADJUSTMENT ledger row is
   * inserted and the student balance is bumped. Decreases are rejected when
   * they would push the balance negative.
   */
  creditHours?: number;
  /**
   * Required at the service layer whenever isPaidStatusOn / creditHours edits
   * cascade to the parent invoice (optimistic-lock guard).
   */
  expectedInvoiceVersion?: number;
}

export interface AccountingPaymentTogglePaidInput {
  id: string;
  isPaidStatusOn: boolean;
  /** Optimistic lock on the parent invoice when auto-flip cascades. */
  expectedInvoiceVersion?: number;
}

/** Joined display shape returned by list/detail queries. */
export interface AccountingPaymentReturnType {
  id: string;
  invoiceId: string;
  amount: string;
  currency: CurrencyCode;
  paymentDate: Date;
  createdAt: Date;
  updatedAt: Date;
  packagePlanId: string | null;
  packageCodename: string | null;
  packageName: string | null;
  paymentGateway: PaymentGateway;
  creditHours: string | null;
  isPaidStatusOn: boolean;
  paymentNote: string | null;
  studentId: string | null;
  studentName: string | null;
  parentId: string | null;
  parentName: string | null;
  invoiceStatus: string;
}

export interface AccountingPaymentBalanceReturnType {
  studentId: string;
  creditHoursTotal: string;
  creditHoursRemaining: string;
}
