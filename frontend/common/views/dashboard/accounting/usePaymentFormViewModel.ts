"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  usePaymentEditSubmit,
  usePaymentSubmit,
} from "@/frontend/common/views/dashboard/accounting/usePaymentFormViewModel.actions.hooks";
import {
  PAYMENTS_PATH,
  SUCCESS_AUTO_DISMISS_MS,
} from "@/frontend/common/views/dashboard/accounting/usePaymentFormViewModel.helpers";
import {
  usePaymentAutoFill,
  usePaymentForms,
} from "@/frontend/common/views/dashboard/accounting/usePaymentFormViewModel.hooks";
import type {
  UsePaymentFormViewModel,
  UsePaymentFormViewModelProps,
} from "@/frontend/common/views/dashboard/accounting/usePaymentFormViewModel.types";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingPayments } from "@/shared/locale/namespaces";

export type { UsePaymentFormViewModel, UsePaymentFormViewModelProps };

export function usePaymentFormViewModel({
  paymentId,
}: Readonly<UsePaymentFormViewModelProps> = {}): UsePaymentFormViewModel {
  const t = useAppTranslation(DashboardAccountingPayments);
  const router = useRouter();
  const isEditing = Boolean(paymentId);

  const { createForm, editForm, existing, loadingExisting } = usePaymentForms({
    paymentId: paymentId ?? "",
    isEditing,
    t,
  });
  const { lastPaymentCurrency, currencyMismatch } = usePaymentAutoFill({ createForm, isEditing });

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

  const { creating, onSubmit } = usePaymentSubmit({ navigateBack, setShowSuccess, setSubmitError, t });

  const { updating, onEditSubmit } = usePaymentEditSubmit({
    paymentId: paymentId ?? "",
    existing,
    navigateBack,
    setShowSuccess,
    setSubmitError,
    t,
  });

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
    lastPaymentCurrency,
    currencyMismatch,
    onSubmit,
    onEditSubmit,
    onDismissSuccess,
    onDismissError,
  };
}
