import type { Control, FieldErrors } from "react-hook-form";
import type { ManualInvoiceFormData } from "@/frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type { ParentInvoiceOption } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceViewTypes";
import type { BillingManualLabels } from "@/shared/locale";

export interface ManualInvoiceParentFieldProps {
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly labels: BillingManualLabels;
  readonly parentOptions: readonly ParentInvoiceOption[];
}
