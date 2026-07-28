import type { Control, FieldErrors } from "react-hook-form";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ManualInvoiceFormData } from "@/frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type { BillingManualLabels, ProfileParentLabels } from "@/shared/locale";

export interface BaseManualInvoiceFormFieldsProps {
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly labels: BillingManualLabels;
  readonly profileLabels: ProfileParentLabels;
  readonly selectedParentId: string | null;
  readonly parentsLoading?: boolean;
}

export interface ManualInvoiceFormFieldsMobileProps extends BaseManualInvoiceFormFieldsProps {
  readonly draftCurrency: CurrencyCode;
}
