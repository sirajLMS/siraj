"use client";

import { useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  accountingPaymentQueryDocument,
  packagePlanQueryDocument,
  studentCreditHourBalanceQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/accounting";
import {
  createPaymentEditSchema,
  createPaymentFormSchema,
  type PaymentEditFormData,
  type PaymentEditFormInput,
  type PaymentFormData,
  type PaymentFormInput,
} from "@/frontend/common/views/dashboard/accounting/schemas/paymentFormSchema";
import {
  asCurrencyCode,
  buildEditFormValues,
  CREATE_DEFAULT_VALUES,
  EDIT_DEFAULT_VALUES,
} from "@/frontend/common/views/dashboard/accounting/usePaymentFormViewModel.helpers";
import type {
  ExistingPayment,
  PaymentCreateForm,
  PaymentEditForm,
} from "@/frontend/common/views/dashboard/accounting/usePaymentFormViewModel.types";
import type { PaymentsLabels } from "@/shared/locale/types/dashboard/accounting/payments";

interface UsePaymentFormsArgs {
  readonly paymentId: string;
  readonly isEditing: boolean;
  readonly t: PaymentsLabels;
}

interface UsePaymentFormsResult {
  readonly createForm: PaymentCreateForm;
  readonly editForm: PaymentEditForm;
  readonly existing: ExistingPayment | undefined;
  readonly loadingExisting: boolean;
}

/**
 * Loads the edited payment (when editing) and owns both react-hook-form
 * instances. The edit form is reseeded whenever the loaded payment changes.
 */
export function usePaymentForms({ paymentId, isEditing, t }: Readonly<UsePaymentFormsArgs>): UsePaymentFormsResult {
  const createSchema = useMemo(() => createPaymentFormSchema(t), [t]);
  const editSchema = useMemo(() => createPaymentEditSchema(t), [t]);

  const { data: existingData, loading: loadingExisting } = useQuery(accountingPaymentQueryDocument, {
    variables: { id: paymentId },
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
      editForm.reset(buildEditFormValues(existing));
    }
  }, [isEditing, existing, editForm]);

  return { createForm, editForm, existing, loadingExisting };
}

interface UsePaymentAutoFillArgs {
  readonly createForm: PaymentCreateForm;
  readonly isEditing: boolean;
}

interface UsePaymentAutoFillResult {
  readonly lastPaymentCurrency: CurrencyCode | null;
  readonly currencyMismatch: boolean;
}

/**
 * Create-path derivations: package auto-fill (snapshot hours/price/currency
 * onto the form when a plan is picked) and the last-payment-currency mismatch
 * warning sourced from the student's credit-hour balance.
 */
export function usePaymentAutoFill({
  createForm,
  isEditing,
}: Readonly<UsePaymentAutoFillArgs>): UsePaymentAutoFillResult {
  const selectedPlanId = useWatch({ control: createForm.control, name: "packagePlanId" });
  const watchedStudentId = useWatch({ control: createForm.control, name: "studentId" });
  const watchedCurrency = useWatch({ control: createForm.control, name: "currency" });

  const { data: balanceData } = useQuery(studentCreditHourBalanceQueryDocument, {
    variables: { studentId: watchedStudentId ?? "" },
    skip: isEditing || !watchedStudentId,
  });

  const lastPaymentCurrency = useMemo<CurrencyCode | null>(() => {
    const raw = balanceData?.studentCreditHourBalance?.lastPaymentCurrency ?? null;
    return raw !== null && asCurrencyCode(raw) !== undefined ? (asCurrencyCode(raw) ?? null) : null;
  }, [balanceData]);

  const currencyMismatch = !isEditing && lastPaymentCurrency !== null && watchedCurrency !== lastPaymentCurrency;

  const { data: planData } = useQuery(packagePlanQueryDocument, {
    variables: { id: selectedPlanId ?? "" },
    skip: isEditing || !selectedPlanId,
  });

  useEffect(() => {
    const plan = planData?.packagePlan;
    if (isEditing || !plan) return;
    createForm.setValue("creditHours", Number(plan.creditHours ?? 1));
    createForm.setValue("amount", Number(plan.priceAmount ?? 0));
    const mappedCurrency = asCurrencyCode(plan.currency ?? null);
    createForm.setValue("currency", mappedCurrency ?? CurrencyCode.Egp);
  }, [isEditing, planData, createForm]);

  return { lastPaymentCurrency, currencyMismatch };
}
