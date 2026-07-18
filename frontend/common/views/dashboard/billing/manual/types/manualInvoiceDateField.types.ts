import type { Control, FieldErrors } from "react-hook-form";
import type { ManualInvoiceFormData } from "@/frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type { BillingManualLabels } from "@/shared/locale";

export interface BaseManualInvoiceDateFieldProps {
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly name: "issueDate" | "dueDate";
}

export interface ManualInvoiceDateFieldDesktopProps extends BaseManualInvoiceDateFieldProps {
  // VARIANT JUSTIFICATION: extra field labels — desktop date field renders a label above the picker; mobile tier is rendered inside a labeled MobileFieldCard wrapper so it needs no label
  readonly labels: BillingManualLabels;
}
