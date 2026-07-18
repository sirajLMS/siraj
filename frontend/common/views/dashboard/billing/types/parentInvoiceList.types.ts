import type {
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
  StudentCreditRow,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type { ParentInvoiceRow } from "@/frontend/common/views/dashboard/billing/types/parentBillingTypes";
import type { StudentCreditStatus } from "@/shared/types/billing-view";

export interface ParentInvoicesActionLabels {
  readonly viewDetails: string;
  readonly viewSubmission: string;
  readonly viewFeedback: string;
  readonly downloadPdf: string;
  readonly payNow: string;
  readonly markAsPaid: string;
}

export interface BaseParentInvoicesListProps {
  readonly rows: readonly ParentInvoiceRow[];
  readonly canView: boolean;
  readonly canSubmitProof: boolean;
  readonly canManage?: boolean;
  readonly billingActionsDisabled?: boolean;
  readonly loading?: boolean;
  readonly onPayNow: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onMarkAsPaid?: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onViewPaymentDetails?: (target: PaymentDetailsTarget) => void;
  readonly onDownloadPdf: (id: string) => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

export interface ParentInvoicesCardListMobileLabels extends ParentInvoicesActionLabels {
  readonly hasPaymentProofHint: string;
  readonly statusLabels: Record<string, string>;
}

export interface ParentInvoicesDataGridDesktopLabels extends ParentInvoicesActionLabels {
  readonly invoiceNumber: string;
  readonly month: string;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly paidDate: string;
  readonly fee: string;
  readonly status: string;
  readonly options: string;
  readonly hasPaymentProofHint: string;
  readonly noEntries: string;
  readonly emptyTitle?: string;
  readonly emptySubtitle?: string;
  readonly statusLabels: Record<string, string>;
}

export type ParentInvoiceRowActionLabels = ParentInvoicesActionLabels;

export interface ParentInvoiceRowActionsProps {
  readonly row: ParentInvoiceRow;
  readonly labels: ParentInvoiceRowActionLabels;
  readonly canView: boolean;
  readonly canSubmitProof: boolean;
  readonly canManage?: boolean;
  readonly billingActionsDisabled?: boolean;
  readonly onPayNow: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onMarkAsPaid?: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onViewPaymentDetails?: (target: PaymentDetailsTarget) => void;
  readonly onDownloadPdf: (id: string) => void;
}

export interface StudentCreditListLabels {
  readonly classesLeft: string;
  readonly sendReminder: string;
  readonly creditStatusLabels: Record<StudentCreditStatus, string>;
}

export interface BaseStudentCreditListProps {
  readonly rows: readonly StudentCreditRow[];
  readonly canManage: boolean;
  readonly billingActionsDisabled?: boolean;
  readonly onSendReminder: (id: string) => void;
  readonly loading?: boolean;
  readonly sendingReminderId?: string | null;
  readonly labels: StudentCreditListLabels;
}

// VARIANT JUSTIFICATION: extra field (none) — kept for symmetry so mobile/desktop tier signatures remain structurally paired with their label-set types
export type StudentCreditCardListMobileProps = BaseStudentCreditListProps;

export interface StudentCreditDataGridDesktopLabels {
  readonly student: string;
  readonly parentContact: string;
  readonly planType: string;
  readonly classesLeft: string;
  readonly status: string;
  readonly quickAction: string;
  readonly sendReminder: string;
  readonly negativeBalance: string;
  readonly activeCredit: string;
  readonly noEntries: string;
  readonly creditStatusLabels: Record<StudentCreditStatus, string>;
}

export interface StudentCreditDataGridDesktopProps extends Omit<BaseStudentCreditListProps, "labels"> {
  // VARIANT JUSTIFICATION: extra field labels — data-grid tier carries grid-shaped labels (column headers + statusLabels + sendReminder + noEntries); mobile card list uses a different labels shape
  readonly labels: StudentCreditDataGridDesktopLabels;
}
