// NEW FOR PLAN v5: Unified Props for the AdminInvoiceCard pair (Class B
// per specs.md §4.1 — the mobile/desktop interfaces were byte-identical
// modulo the tier suffix). Both tier files now import this single type.

import type { AdminBillingViewModel } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel";
import type {
  AdminInvoiceRow,
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";

export interface AdminInvoiceCardProps {
  readonly row: AdminInvoiceRow;
  readonly labels: AdminBillingViewModel["labels"];
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly billingActionsDisabled: boolean;
  readonly onMarkAsPaid: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onViewPaymentDetails?: (target: PaymentDetailsTarget) => void;
  readonly onDeleteInvoice?: (invoiceId: string) => void;
}
