import {
  type AccountingPaymentQuery_accountingPayment,
  CurrencyCode,
  PaymentGateway,
  type RecordAccountingPaymentMutationVariables,
  type UpdateAccountingPaymentMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { asCurrencyCode } from "@/frontend/common/views/dashboard/accounting/__shared__";
import type {
  PaymentEditFormData,
  PaymentEditFormInput,
  PaymentFormData,
  PaymentFormInput,
} from "@/frontend/common/views/dashboard/accounting/schemas/paymentFormSchema";

export const SUCCESS_AUTO_DISMISS_MS = 3000;
export const PAYMENTS_PATH = "/accounting/payments";

export const CREATE_DEFAULT_VALUES: PaymentFormInput = {
  studentId: "",
  packagePlanId: null,
  creditHours: 1,
  amount: 0,
  currency: CurrencyCode.Egp,
  paymentGateway: PaymentGateway.None,
  paymentDate: new Date().toISOString().slice(0, 10),
  isPaidStatusOn: false,
  paymentNote: null,
};

export const EDIT_DEFAULT_VALUES: PaymentEditFormInput = {
  creditHours: 1,
  paymentGateway: PaymentGateway.None,
  paymentNote: null,
};

export { asCurrencyCode };

/** Maps a loaded payment row onto the edit-form field values. */
export function buildEditFormValues(existing: AccountingPaymentQuery_accountingPayment): PaymentEditFormInput {
  return {
    creditHours: Number(existing.creditHours ?? 1),
    paymentGateway: existing.paymentGateway ?? PaymentGateway.None,
    paymentNote: existing.paymentNote ?? null,
  };
}

/** Builds the record-payment payload, normalizing the bare date input to a full timestamp. */
export function buildRecordPaymentInput(data: PaymentFormData): RecordAccountingPaymentMutationVariables["input"] {
  return {
    studentId: data.studentId,
    packagePlanId: data.packagePlanId ?? null,
    creditHours: data.creditHours,
    amount: data.amount,
    currency: data.currency,
    paymentGateway: data.paymentGateway,
    // GraphQL DateTime scalar requires a full ISO-8601 timestamp;
    // the date input yields a bare YYYY-MM-DD string.
    paymentDate: new Date(`${data.paymentDate}T12:00:00`).toISOString(),
    isPaidStatusOn: data.isPaidStatusOn,
    paymentNote: data.paymentNote ?? null,
  };
}

/** Builds the update-payment payload. */
export function buildUpdatePaymentInput(
  data: PaymentEditFormData,
  paymentId: string
): UpdateAccountingPaymentMutationVariables["input"] {
  return {
    id: paymentId,
    creditHours: data.creditHours,
    paymentGateway: data.paymentGateway,
    paymentNote: data.paymentNote ?? null,
    // Explicit null = skip the optimistic-lock check (the service uses
    // `!= null`). The payment object does not yet expose the live invoice
    // version, so the check is intentionally skipped here.
    expectedInvoiceVersion: null,
  };
}
