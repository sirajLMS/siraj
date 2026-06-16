import type { AdminBillingViewProps, ParentBillingViewProps } from "../types/billingViewTypes";

export function filterAdminInvoices(
  invoices: AdminBillingViewProps["invoices"],
  searchQuery: string
): AdminBillingViewProps["invoices"] {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  if (normalizedQuery.length === 0) {
    return invoices;
  }

  return invoices.filter(invoice => {
    const invoiceId = invoice.id.toLowerCase();
    return (
      invoice.studentName.toLowerCase().includes(normalizedQuery) ||
      invoiceId.includes(normalizedQuery) ||
      invoice.amount.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function filterParentInvoices(
  invoices: ParentBillingViewProps["invoices"],
  searchQuery: string
): ParentBillingViewProps["invoices"] {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  if (normalizedQuery.length === 0) {
    return invoices;
  }

  return invoices.filter(invoice => {
    return (
      invoice.invoiceNumber.toLowerCase().includes(normalizedQuery) ||
      invoice.month.toLowerCase().includes(normalizedQuery)
    );
  });
}
