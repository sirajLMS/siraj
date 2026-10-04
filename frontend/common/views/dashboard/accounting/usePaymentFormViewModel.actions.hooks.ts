"use client";

import { useMutation } from "@apollo/client/react";
import { useCallback } from "react";
import {
  recordAccountingPaymentMutationDocument,
  updateAccountingPaymentMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/accounting";
import { logger } from "@/frontend/common/utils/logger";
import type {
  PaymentEditFormData,
  PaymentFormData,
} from "@/frontend/common/views/dashboard/accounting/schemas/paymentFormSchema";
import {
  buildRecordPaymentInput,
  buildUpdatePaymentInput,
} from "@/frontend/common/views/dashboard/accounting/usePaymentFormViewModel.helpers";
import type { ExistingPayment } from "@/frontend/common/views/dashboard/accounting/usePaymentFormViewModel.types";
import type { PaymentsLabels } from "@/shared/locale/types/dashboard/accounting/payments";

interface UsePaymentSubmitArgs {
  readonly navigateBack: () => void;
  readonly setShowSuccess: (value: boolean) => void;
  readonly setSubmitError: (value: string | null) => void;
  readonly t: PaymentsLabels;
}

interface UsePaymentSubmitResult {
  readonly creating: boolean;
  readonly onSubmit: (data: PaymentFormData) => Promise<void>;
}

/** Owns the record-payment mutation and the create-form submit handler. */
export function usePaymentSubmit({
  navigateBack,
  setShowSuccess,
  setSubmitError,
  t,
}: Readonly<UsePaymentSubmitArgs>): UsePaymentSubmitResult {
  const [recordPaymentMutation, { loading: creating }] = useMutation(recordAccountingPaymentMutationDocument);

  const onSubmit = useCallback(
    async (data: PaymentFormData) => {
      setSubmitError(null);
      try {
        await recordPaymentMutation({ variables: { input: buildRecordPaymentInput(data) } });
        setShowSuccess(true);
        setTimeout(navigateBack, 600);
      } catch (error) {
        logger.error("recordAccountingPayment failed", { error });
        setSubmitError(error instanceof Error ? error.message : t.saveError);
      }
    },
    [recordPaymentMutation, navigateBack, setShowSuccess, setSubmitError, t.saveError]
  );

  return { creating, onSubmit };
}

interface UsePaymentEditSubmitArgs {
  readonly paymentId: string;
  readonly existing: ExistingPayment | undefined;
  readonly navigateBack: () => void;
  readonly setShowSuccess: (value: boolean) => void;
  readonly setSubmitError: (value: string | null) => void;
  readonly t: PaymentsLabels;
}

interface UsePaymentEditSubmitResult {
  readonly updating: boolean;
  readonly onEditSubmit: (data: PaymentEditFormData) => Promise<void>;
}

/** Owns the update-payment mutation and the edit-form submit handler. */
export function usePaymentEditSubmit({
  paymentId,
  existing,
  navigateBack,
  setShowSuccess,
  setSubmitError,
  t,
}: Readonly<UsePaymentEditSubmitArgs>): UsePaymentEditSubmitResult {
  const [updatePaymentMutation, { loading: updating }] = useMutation(updateAccountingPaymentMutationDocument);

  const onEditSubmit = useCallback(
    async (data: PaymentEditFormData) => {
      if (!paymentId || !existing) return;
      setSubmitError(null);
      try {
        await updatePaymentMutation({ variables: { input: buildUpdatePaymentInput(data, paymentId) } });
        setShowSuccess(true);
        setTimeout(navigateBack, 600);
      } catch (error) {
        logger.error("updateAccountingPayment failed", { error });
        setSubmitError(error instanceof Error ? error.message : t.saveError);
      }
    },
    [paymentId, existing, updatePaymentMutation, navigateBack, setShowSuccess, setSubmitError, t.saveError]
  );

  return { updating, onEditSubmit };
}
