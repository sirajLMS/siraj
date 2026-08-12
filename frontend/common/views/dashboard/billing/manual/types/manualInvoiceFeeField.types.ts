import type { Control, FieldErrors } from "react-hook-form";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ManualInvoiceFormData } from "@/frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type { BillingManualLabels } from "@/shared/locale";

export interface BaseManualInvoiceFeeFieldProps {
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly labels: BillingManualLabels;
}

export interface ManualInvoiceFeeFieldMobileProps extends BaseManualInvoiceFeeFieldProps {
  // VARIANT JUSTIFICATION: extra field draftCurrency — mobile fee field shows the drafted currency symbol inline (desktop tier shows a generic Payments icon instead)
  readonly draftCurrency?: CurrencyCode;
}
