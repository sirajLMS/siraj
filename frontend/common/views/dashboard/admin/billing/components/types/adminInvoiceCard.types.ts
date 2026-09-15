import type { Button } from "@mui/material";
import type { AdminBillingViewModel } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel";
import type {
  AdminInvoiceRow,
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type { AdminInvoiceStatus } from "@/shared/types/billing-view";

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

/**
 * Slot props supplied by each tier wrapper to `AdminInvoiceCardShared`.
 * Only the tier-specific primitives (`StatusBadge`, `PersonProfileLink`,
 * `ActionButton`) vary between desktop and mobile — everything else is
 * identical scaffold.
 */
export interface AdminInvoiceCardSlotProps {
  readonly StatusBadge: React.ComponentType<{
    readonly category: "invoice";
    readonly status: AdminInvoiceStatus;
    readonly label: string;
  }>;
  readonly PersonProfileLink: React.ComponentType<{
    readonly href?: string;
    readonly name: string;
    readonly avatarSize: number;
    readonly typographyVariant: "titleLg";
    readonly fontWeight: number;
  }>;
  readonly ActionButton: React.ComponentType<React.ComponentProps<typeof Button>>;
}
