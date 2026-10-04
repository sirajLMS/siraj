"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  createExpenseMutationDocument,
  updateExpenseMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import {
  buildCreateExpenseInput,
  buildFormDefaults,
  buildUpdateExpenseInput,
  EXPENSES_LIST_FIELD,
  type ExpenseFormRow,
  getGraphQLErrorCode,
  getGraphQLErrorMessage,
  resolveSubmitFieldError,
} from "@/frontend/common/views/dashboard/accounting/expenses/useExpenseFormViewModel.helpers";
import {
  type ExpenseFormData,
  type ExpenseFormInput,
  isValidExpenseData,
} from "@/frontend/common/views/dashboard/accounting/expenses/useExpenseFormViewModel.schema";
import type { CommonLabels } from "@/shared/locale/types/common";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

interface ExpenseFormSession {
  /** Idempotency token for the current dialog session, or null before open. */
  readonly clientRequestId: () => string | null;
  /** Token already consumed by a submit, so retries inside a session dedupe. */
  readonly submittedToken: () => string | null;
  /** Latest row snapshot, read at submit time rather than captured at open. */
  readonly currentRow: () => ExpenseFormRow | null;
  /** Arms the submit guard with the token that started the in-flight write. */
  readonly markSubmitted: (token: string) => void;
  /** Re-arms the submit guard after a failed write so the operator can retry. */
  readonly rearmSubmit: () => void;
}

interface UseExpenseFormSessionProps {
  readonly open: boolean;
  readonly row: ExpenseFormRow | null;
  readonly form: UseFormReturn<ExpenseFormInput, undefined, ExpenseFormData>;
}

/**
 * Owns the per-session refs that tie an open dialog to one idempotent write and
 * seeds the form from the row snapshot at open time. The row ref keeps the
 * reset effect stable against mid-session row identity changes, and the token
 * doubles as the update-mode submit guard (update carries no clientRequestId).
 */
export function useExpenseFormSession({ open, row, form }: Readonly<UseExpenseFormSessionProps>): ExpenseFormSession {
  const clientRequestIdRef = useRef<string | null>(null);
  const submittedTokenRef = useRef<string | null>(null);
  const rowRef = useRef<ExpenseFormRow | null>(row);
  // Declared before the open-reset effect so the ref stays current whenever
  // that effect reads the latest snapshot.
  useEffect(() => {
    rowRef.current = row;
  });

  useEffect(() => {
    if (!open) return;
    clientRequestIdRef.current = crypto.randomUUID();
    submittedTokenRef.current = null;
    form.reset(buildFormDefaults(rowRef.current));
  }, [open, form]);

  const clientRequestId = useCallback(() => clientRequestIdRef.current, []);
  const submittedToken = useCallback(() => submittedTokenRef.current, []);
  const currentRow = useCallback(() => rowRef.current, []);
  const markSubmitted = useCallback((token: string) => {
    submittedTokenRef.current = token;
  }, []);
  const rearmSubmit = useCallback(() => {
    submittedTokenRef.current = null;
  }, []);

  return useMemo(
    () => ({ clientRequestId, submittedToken, currentRow, markSubmitted, rearmSubmit }),
    [clientRequestId, submittedToken, currentRow, markSubmitted, rearmSubmit]
  );
}

interface UseExpenseFormSubmitProps {
  readonly form: UseFormReturn<ExpenseFormInput, undefined, ExpenseFormData>;
  readonly session: ExpenseFormSession;
  readonly labels: ExpensesLabels;
  readonly commonLabels: CommonLabels;
  readonly isEdit: boolean;
  readonly onSaved?: () => void;
  readonly onClose: () => void;
}

/**
 * Runs one dialog submit end to end: validates through the Zod resolver,
 * dispatches create or update with the session idempotency token, maps terminal
 * domain rejections onto inline field errors, and refreshes the list cache on
 * success. The wrapped handler never rejects.
 */
export function useExpenseFormSubmit({
  form,
  session,
  labels,
  commonLabels,
  isEdit,
  onSaved,
  onClose,
}: Readonly<UseExpenseFormSubmitProps>) {
  const client = useApolloClient();
  const notifications = useNotifications();
  const [createExpense, { loading: creating }] = useMutation(createExpenseMutationDocument, {
    // Domain errors reject with CombinedGraphQLErrors carrying extensions.code.
    errorPolicy: "none",
  });
  const [updateExpense, { loading: updating }] = useMutation(updateExpenseMutationDocument, {
    errorPolicy: "none",
  });

  const applySubmitError = useCallback(
    (error: unknown) => {
      const fieldError = resolveSubmitFieldError(getGraphQLErrorCode(error), error, labels);
      if (fieldError !== null) {
        form.setError(fieldError.field, { message: fieldError.message });
        return;
      }
      notifications.show(getGraphQLErrorMessage(error) ?? commonLabels.operationFailed, { severity: "error" });
    },
    [form, labels, notifications, commonLabels]
  );

  const applySubmitSuccess = useCallback(() => {
    // The list query carries aggregates (totals depend on every row), so the
    // whole root field is dropped rather than patching rows in place.
    client.cache.evict({ fieldName: EXPENSES_LIST_FIELD });
    client.cache.gc();
    notifications.show(isEdit ? labels.success.updated : labels.success.created, { severity: "success" });
    onSaved?.();
    onClose();
  }, [client, labels, notifications, isEdit, onSaved, onClose]);

  const handleFormSubmit = useCallback(
    async (data: ExpenseFormData): Promise<void> => {
      const idempotencyToken = session.clientRequestId();
      if (idempotencyToken === null || session.submittedToken() === idempotencyToken) return;
      // handleSubmit only runs the resolver-validated payload; this narrowing
      // guards the fallback path and keeps the builders on non-null types.
      if (!isValidExpenseData(data)) return;
      // An edit target without an id is a broken snapshot; refuse silently
      // rather than sending a malformed patch.
      const currentRow = session.currentRow();
      if (currentRow !== null && currentRow.id === null) return;
      session.markSubmitted(idempotencyToken);
      try {
        if (currentRow !== null) {
          await updateExpense({
            variables: { input: buildUpdateExpenseInput(data, currentRow, currentRow.id ?? "") },
          });
        } else {
          await createExpense({ variables: { input: buildCreateExpenseInput(data, idempotencyToken) } });
        }
      } catch (error) {
        // Re-arm the guard so the operator can retry in this dialog session; the
        // reused token keeps the retry idempotent server-side.
        session.rearmSubmit();
        applySubmitError(error);
        return;
      }
      applySubmitSuccess();
    },
    [createExpense, updateExpense, session, applySubmitError, applySubmitSuccess]
  );

  // handleSubmit runs validation on demand; wrapping it keeps the render path
  // free of any ref access until the submit event actually fires.
  const onSubmit = useCallback(() => {
    void form.handleSubmit(handleFormSubmit)();
  }, [form, handleFormSubmit]);

  return { submitting: creating || updating, onSubmit };
}
