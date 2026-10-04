import type { Control, FieldErrors, UseFormHandleSubmit, UseFormReturn } from "react-hook-form";
import type { AccountingPaymentQuery, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  PaymentEditFormData,
  PaymentEditFormInput,
  PaymentFormData,
  PaymentFormInput,
} from "@/frontend/common/views/dashboard/accounting/schemas/paymentFormSchema";
import type { PaymentsLabels } from "@/shared/locale/types/dashboard/accounting/payments";

/** The react-hook-form instance used for the create payment form. */
export type PaymentCreateForm = UseFormReturn<PaymentFormInput, undefined, PaymentFormData>;

/** The react-hook-form instance used for the edit payment form. */
export type PaymentEditForm = UseFormReturn<PaymentEditFormInput, undefined, PaymentEditFormData>;

/** A loaded accounting payment row (nullable, as selected by `AccountingPaymentQuery`). */
export type ExistingPayment = AccountingPaymentQuery["accountingPayment"];

/** Flat view model returned by `usePaymentFormViewModel`. */
export interface UsePaymentFormViewModel {
  readonly t: PaymentsLabels;
  readonly control: Control<PaymentFormInput, undefined, PaymentFormData>;
  readonly editControl: Control<PaymentEditFormInput, undefined, PaymentEditFormData>;
  readonly errors: FieldErrors<PaymentFormInput>;
  readonly editErrors: FieldErrors<PaymentEditFormInput>;
  readonly handleSubmit: UseFormHandleSubmit<PaymentFormInput, PaymentFormData>;
  readonly handleEditSubmit: UseFormHandleSubmit<PaymentEditFormInput, PaymentEditFormData>;
  readonly isSubmitting: boolean;
  readonly isEditing: boolean;
  readonly loadingExisting: boolean;
  readonly showSuccess: boolean;
  readonly submitError: string | null;
  readonly existing: AccountingPaymentQuery["accountingPayment"] | undefined;
  /** Currency of the selected student's most recent payment (null when unknown). */
  readonly lastPaymentCurrency: CurrencyCode | null;
  /** True when the chosen currency differs from the student's last payment currency. */
  readonly currencyMismatch: boolean;
  readonly onSubmit: (data: PaymentFormData) => Promise<void>;
  readonly onEditSubmit: (data: PaymentEditFormData) => Promise<void>;
  readonly onDismissSuccess: () => void;
  readonly onDismissError: () => void;
}

/** Props accepted by `usePaymentFormViewModel`. */
export interface UsePaymentFormViewModelProps {
  readonly paymentId?: string;
}
