"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { format } from "date-fns";
import { type RefObject, useEffect, useRef, useState } from "react";
import { formatDateInput } from "@/frontend/common/components/intl/dateFormat";
import type { BulkToExpenseInput } from "@/frontend/common/graphql/generated/gql/graphql";
import { bulkCarryoverToExpenseMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import {
  ALREADY_PAID_ERROR_CODE,
  CARRYOVER_LIST_FIELD,
  EXPENSE_MONTH_FORMAT,
  getGraphQLErrorCode,
  getGraphQLErrorMessage,
  isValidDate,
  toOptionalNote,
} from "@/frontend/common/views/dashboard/accounting/carryover/BulkToExpenseModal.helpers";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingCarryover, Translation } from "@/shared/locale/namespaces";

/**
 * Ephemeral dialog-session state: the two date pickers, the note, the
 * already-paid rejection flag, and the per-session idempotency refs. Re-opening
 * the dialog resets the fields during render so no cascading effect fires.
 */
export function useBulkToExpenseState(open: boolean) {
  const [paymentDate, setPaymentDate] = useState<Date | null>(null);
  const [expenseMonth, setExpenseMonth] = useState<Date | null>(null);
  const [note, setNote] = useState("");
  const [alreadyPaidRejected, setAlreadyPaidRejected] = useState(false);

  // One idempotency token per dialog session: re-opening the dialog starts a
  // fresh conversion, while retries inside the same session reuse the token so
  // the server-side idempotency window absorbs double submissions.
  const clientRequestIdRef = useRef<string | null>(null);
  const submittedTokenRef = useRef<string | null>(null);

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setPaymentDate(null);
      setExpenseMonth(null);
      setNote("");
      setAlreadyPaidRejected(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    clientRequestIdRef.current = crypto.randomUUID();
    submittedTokenRef.current = null;
  }, [open]);

  return {
    paymentDate,
    setPaymentDate,
    expenseMonth,
    setExpenseMonth,
    note,
    setNote,
    alreadyPaidRejected,
    setAlreadyPaidRejected,
    clientRequestIdRef,
    submittedTokenRef,
  };
}

interface UseBulkToExpenseSubmitArgs {
  readonly carryoverIds: readonly string[];
  readonly paymentDate: Date | null;
  readonly expenseMonth: Date | null;
  readonly note: string;
  readonly clientRequestIdRef: RefObject<string | null>;
  readonly submittedTokenRef: RefObject<string | null>;
  readonly setAlreadyPaidRejected: (value: boolean) => void;
  readonly onClose: () => void;
  readonly onDone?: () => void;
}

/**
 * Owns the bulk-to-expense mutation plus the submit handler: idempotency guard,
 * cache eviction after success, notification, and the domain-rejection banner.
 */
export function useBulkToExpenseSubmit({
  carryoverIds,
  paymentDate,
  expenseMonth,
  note,
  clientRequestIdRef,
  submittedTokenRef,
  setAlreadyPaidRejected,
  onClose,
  onDone,
}: Readonly<UseBulkToExpenseSubmitArgs>) {
  const labels = useAppTranslation(DashboardAccountingCarryover);
  const commonLabels = useAppTranslation(Translation.Common);
  const notifications = useNotifications();
  const client = useApolloClient();

  const [bulkToExpense, { loading: submitting }] = useMutation(bulkCarryoverToExpenseMutationDocument, {
    // Domain errors reject with CombinedGraphQLErrors carrying extensions.code.
    errorPolicy: "none",
  });

  const applySubmitSuccess = () => {
    // The list query carries aggregates (totals depend on every row), so the
    // whole root field is dropped rather than patching rows in place.
    client.cache.evict({ fieldName: CARRYOVER_LIST_FIELD });
    client.cache.gc();
    notifications.show(labels.success.bulkedToExpense(carryoverIds.length), { severity: "success" });
    onDone?.();
    onClose();
  };

  const applySubmitError = (error: unknown) => {
    if (getGraphQLErrorCode(error) === ALREADY_PAID_ERROR_CODE) {
      // Non-dismissible in-dialog banner: the operator must close the dialog
      // and fix the selection (e.g. unpay first) rather than retry as-is.
      setAlreadyPaidRejected(true);
      return;
    }
    notifications.show(getGraphQLErrorMessage(error) ?? commonLabels.operationFailed, { severity: "error" });
  };

  const handleSubmit = async (): Promise<void> => {
    const clientRequestId = clientRequestIdRef.current;
    if (clientRequestId === null || submittedTokenRef.current === clientRequestId) return;
    if (!(isValidDate(paymentDate) && isValidDate(expenseMonth)) || carryoverIds.length === 0) return;
    submittedTokenRef.current = clientRequestId;
    const input: BulkToExpenseInput = {
      carryoverIds: [...carryoverIds],
      paymentDate: formatDateInput(paymentDate),
      expenseDate: format(expenseMonth, EXPENSE_MONTH_FORMAT),
      note: toOptionalNote(note),
      clientRequestId,
    };
    try {
      await bulkToExpense({ variables: { input } });
    } catch (error) {
      // Re-arm the guard so the operator can retry in this dialog session; the
      // reused token keeps the retry idempotent server-side.
      submittedTokenRef.current = null;
      applySubmitError(error);
      return;
    }
    applySubmitSuccess();
  };

  return { labels, commonLabels, submitting, handleSubmit };
}
