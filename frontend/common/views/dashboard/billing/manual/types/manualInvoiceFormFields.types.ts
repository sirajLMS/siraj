import type { Control, FieldErrors } from "react-hook-form";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ManualInvoiceFormData } from "@/frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type {
  ParentInvoiceOption,
  StudentOption,
} from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceViewTypes";
import type { BillingManualLabels } from "@/shared/locale";

export interface BaseManualInvoiceFormFieldsProps {
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly labels: BillingManualLabels;
  readonly parentOptions: readonly ParentInvoiceOption[];
  readonly studentOptions: readonly StudentOption[];
  readonly parentsLoading?: boolean;
  readonly studentsLoading?: boolean;
}

export interface ManualInvoiceFormFieldsMobileProps extends BaseManualInvoiceFormFieldsProps {
  // VARIANT JUSTIFICATION: extra field draftCurrency — mobile tier threads the drafted currency to the inline mobile fee field adornment; desktop fee field renders a generic Payments icon instead
  readonly draftCurrency: CurrencyCode;
}
