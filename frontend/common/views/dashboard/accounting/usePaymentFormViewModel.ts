"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type Control, type FieldErrors, type UseFormHandleSubmit, useForm } from "react-hook-form";
import {
  type AccountingPaymentQuery,
  CurrencyCode,
  PaymentGateway,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  accountingPaymentQueryDocument,
  packagePlanQueryDocument,
  recordAccountingPaymentMutationDocument,
  updateAccountingPaymentMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/accounting";
import { logger } from "@/frontend/common/utils/logger";
import {
  createPaymentEditSchema,
  createPaymentFormSchema,
  type PaymentEditFormData,
  type PaymentEditFormInput,
  type PaymentFormData,
  type PaymentFormInput,
} from "@/frontend/common/views/dashboard/accounting/schemas/paymentFormSchema";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingPayments } from "@/shared/locale/namespaces";
import type { PaymentsLabels } from "@/shared/locale/types/dashboard/accounting/payments";

const SUCCESS_AUTO_DISMISS_MS = 3000;
const PAYMENTS_PATH = "/accounting/payments";

const CREATE_DEFAULT_VALUES: PaymentFormInput = {
  studentId: "",
  packagePlanId: null,
  creditHours: 1,
  amount: 0,
  currency: CurrencyCode.Egp,
  paymentGateway: PaymentGateway.None,
  paymentDate: new Date().toISOString().slice(0, 10),
  isPaidStatusOn: true,
  paymentNote: null,
};

const EDIT_DEFAULT_VALUES: PaymentEditFormInput = {
  creditHours: 1,
  paymentGateway: PaymentGateway.None,
  paymentNote: null,
};

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
  readonly onSubmit: (data: PaymentFormData) => Promise<void>;
  readonly onEditSubmit: (data: PaymentEditFormData) => Promise<void>;
  readonly onDismissSuccess: () => void;
  readonly onDismissError: () => void;
}

export interface UsePaymentFormViewModelProps {
  readonly paymentId?: string;
}

export function usePaymentFormViewModel({
  paymentId,
}: Readonly<UsePaymentFormViewModelProps> = {}): UsePaymentFormViewModel {
  const t = useAppTranslation(DashboardAccountingPayments);
  const router = useRouter();
  const isEditing = Boolean(paymentId);

  const createSchema = useMemo(() => createPaymentFormSchema(t), [t]);
  const editSchema = useMemo(() => createPaymentEditSchema(t), [t]);

  const { data: existingData, loading: loadingExisting } = useQuery(accountingPaymentQueryDocument, {
    variables: { id: paymentId ?? "" },
    skip: !isEditing,
  });

  const existing = existingData?.accountingPayment;

  const createForm = useForm<PaymentFormInput, undefined, PaymentFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: CREATE_DEFAULT_VALUES,
  });

  const editForm = useForm<PaymentEditFormInput, undefined, PaymentEditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: EDIT_DEFAULT_VALUES,
  });

  useEffect(() => {
    if (isEditing && existing) {
      editForm.reset({
        creditHours: Number(existing.creditHours ?? 1),
        paymentGateway: existing.paymentGateway ?? PaymentGateway.None,
        paymentNote: existing.paymentNote ?? null,
      });
    }
  }, [isEditing, existing, editForm]);

  // Package auto-fill: when a plan is selected on the CREATE path, snapshot
  // its hours/price/currency onto the form. Fields stay editable afterwards.
  // react-hook-form watch() returns fresh functions each render, which React
  // Compiler cannot memoize — expected for form bindings and render-safe here,
  // so skip that single check (the value is only used as a query variable).
  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedPlanId = createForm.watch("packagePlanId");

  const { data: planData } = useQuery(packagePlanQueryDocument, {
    variables: { id: selectedPlanId ?? "" },
    skip: isEditing || !selectedPlanId,
  });

  useEffect(() => {
    const plan = planData?.packagePlan;
    if (isEditing || !plan) return;
    createForm.setValue("creditHours", Number(plan.creditHours ?? 1));
    createForm.setValue("amount", Number(plan.priceAmount ?? 0));
    const rawCurrency = plan.currency ?? null;
    const mappedCurrency =
      rawCurrency != null ? Object.values(CurrencyCode).find(member => String(member) === rawCurrency) : undefined;
    createForm.setValue("currency", mappedCurrency ?? CurrencyCode.Egp);
  }, [isEditing, planData, createForm]);

  const [recordPaymentMutation, { loading: creating }] = useMutation(recordAccountingPaymentMutationDocument);
  const [updatePaymentMutation, { loading: updating }] = useMutation(updateAccountingPaymentMutationDocument);

  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!showSuccess) {
      return undefined;
    }
    const timer = setTimeout(() => setShowSuccess(false), SUCCESS_AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [showSuccess]);

  const navigateBack = useCallback(() => {
    router.push(PAYMENTS_PATH);
  }, [router]);

  const onSubmit = useCallback(
    async (data: PaymentFormData) => {
      setSubmitError(null);
      try {
        await recordPaymentMutation({
          variables: {
            input: {
              studentId: data.studentId,
              packagePlanId: data.packagePlanId || null,
              creditHours: data.creditHours,
              amount: data.amount,
              currency: data.currency,
              paymentGateway: data.paymentGateway,
              // GraphQL DateTime scalar requires a full ISO-8601 timestamp;
              // the date input yields a bare YYYY-MM-DD string.
              paymentDate: new Date(`${data.paymentDate}T12:00:00`).toISOString(),
              isPaidStatusOn: data.isPaidStatusOn,
              paymentNote: data.paymentNote || null,
            },
          },
        });
        setShowSuccess(true);
        setTimeout(navigateBack, 600);
      } catch (error) {
        logger.error("recordAccountingPayment failed", { error });
        setSubmitError(error instanceof Error ? error.message : t.saveError);
      }
    },
    [recordPaymentMutation, navigateBack, t.saveError]
  );

  const onEditSubmit = useCallback(
    async (data: PaymentEditFormData) => {
      if (!paymentId || !existing) return;
      setSubmitError(null);
      try {
        await updatePaymentMutation({
          variables: {
            input: {
              id: paymentId,
              creditHours: data.creditHours,
              paymentGateway: data.paymentGateway,
              paymentNote: data.paymentNote || null,
              // Explicit null = skip the optimistic-lock check (service uses
              // `!= null`). The payment object does not yet expose the live
              // invoice version (carry-forward: expose invoiceVersion field).
              expectedInvoiceVersion: null,
            },
          },
        });
        setShowSuccess(true);
        setTimeout(navigateBack, 600);
      } catch (error) {
        logger.error("updateAccountingPayment failed", { error });
        setSubmitError(error instanceof Error ? error.message : t.saveError);
      }
    },
    [paymentId, existing, updatePaymentMutation, navigateBack, t.saveError]
  );

  const onDismissSuccess = useCallback(() => setShowSuccess(false), []);
  const onDismissError = useCallback(() => setSubmitError(null), []);

  return {
    t,
    control: createForm.control,
    editControl: editForm.control,
    errors: createForm.formState.errors,
    editErrors: editForm.formState.errors,
    handleSubmit: createForm.handleSubmit,
    handleEditSubmit: editForm.handleSubmit,
    isSubmitting: creating || updating,
    isEditing,
    loadingExisting,
    showSuccess,
    submitError,
    existing,
    onSubmit,
    onEditSubmit,
    onDismissSuccess,
    onDismissError,
  };
}
