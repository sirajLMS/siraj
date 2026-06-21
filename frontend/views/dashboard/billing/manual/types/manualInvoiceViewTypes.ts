import type { BillingManualLabels } from "@/shared/messages/types/dashboard/billing/manual";
import type { ManualInvoiceFormData } from "../schemas/manualInvoiceSchema";

export type ManualInvoiceLabels = BillingManualLabels;

export interface ParentInvoiceOption {
  readonly id: string;
  readonly name: string;
  readonly label: string;
}

export interface ManualInvoiceViewProps {
  readonly labels: ManualInvoiceLabels;
  readonly parentOptions: readonly ParentInvoiceOption[];
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly canCreate: boolean;
  readonly canSendEmail: boolean;
  readonly onBack: () => void;
  readonly onSubmit: (data: ManualInvoiceFormData, sendEmail: boolean) => void;
  readonly onDismissSuccess: () => void;
}
