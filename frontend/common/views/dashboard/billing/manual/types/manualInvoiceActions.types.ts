import type { BillingManualLabels } from "@/shared/locale";

export interface ManualInvoiceActionsProps {
  readonly labels: BillingManualLabels;
  readonly canCreate: boolean;
  readonly canSendEmail: boolean;
  readonly isSubmitting: boolean;
  readonly onSubmit: () => void;
  readonly onSubmitAndSendEmail: () => void;
}
