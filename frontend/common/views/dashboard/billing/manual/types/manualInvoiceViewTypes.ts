import type { ManualInvoiceFormData } from "@/frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type { BillingManualLabels } from "@/shared/locale/types/dashboard/billing/manual";

export type ManualInvoiceLabels = BillingManualLabels;

export interface ParentInvoiceOption {
  readonly id: string;
  readonly userId: string | null;
  readonly name: string;
  readonly label: string;
}

export interface StudentOption {
  readonly id: string;
  readonly name: string;
}

export interface ManualInvoiceViewProps {
  readonly labels: ManualInvoiceLabels;
  readonly parentOptions: readonly ParentInvoiceOption[];
  readonly studentOptions: readonly StudentOption[];
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly canCreate: boolean;
  readonly canSendEmail: boolean;
  readonly parentsLoading: boolean;
  readonly studentsLoading: boolean;
  readonly onBack: () => void;
  readonly onSubmit: (data: ManualInvoiceFormData, sendEmail: boolean) => void;
  readonly onDismissSuccess: () => void;
  readonly onParentChange: (parentId: string | null) => void;
}
