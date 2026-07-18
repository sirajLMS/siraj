import type {
  MarkPaidInvoiceTarget,
  StudentCreditRow,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type { ParentInvoiceRow } from "@/frontend/common/views/dashboard/billing/types/parentBillingTypes";

export function buildInvoiceTarget(row: ParentInvoiceRow): MarkPaidInvoiceTarget {
  return {
    id: row.id,
    amount: row.fee,
    dueDate: row.dueDate,
    invoiceNumber: row.invoiceNumber,
  };
}

export function formatClassesLeft(row: StudentCreditRow): string {
  return `${row.classesLeft} / ${row.classesTotal}`;
}
