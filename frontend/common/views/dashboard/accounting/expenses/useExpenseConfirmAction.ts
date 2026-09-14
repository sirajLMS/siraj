"use client";

import { CombinedGraphQLErrors, type TypedDocumentNode } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ExpensesQuery_expenses_rows } from "@/frontend/common/graphql/generated/gql/graphql";
import { getGraphQLErrorMessage } from "@/frontend/common/utils/errorUtils";

/** Root field holding the expense ledger page; dropped after writes because aggregates depend on every row. */
const EXPENSES_LIST_FIELD = "expenses";

/**
 * Domain error code raised when the row is a salary expense whose linked
 * carryover balance is still paid; the operator must go through the Unpay flow
 * instead of deleting directly.
 */
const EXPENSE_DELETE_VIA_UNPAY_CODE = "EXPENSE_DELETE_VIA_UNPAY";

/**
 * Row snapshot the expense delete confirmations restate. Grid rows satisfy this
 * shape directly; only the fields the dialogs render or submit are required.
 */
export type ExpenseConfirmRow = Pick<ExpensesQuery_expenses_rows, "id" | "title" | "expenseValue" | "expenseCurrency">;

/** True when the rejection carries the paid-carryover delete guard (`EXPENSE_DELETE_VIA_UNPAY`). */
export function isExpenseDeleteViaUnpayError(error: unknown): boolean {
  if (!CombinedGraphQLErrors.is(error)) return false;
  return error.errors.some(graphQLError => graphQLError.extensions?.code === EXPENSE_DELETE_VIA_UNPAY_CODE);
}

export interface UseExpenseConfirmActionOptions<TData, TVariables extends Record<string, unknown>> {
  readonly open: boolean;
  readonly row: ExpenseConfirmRow | null;
  readonly document: TypedDocumentNode<TData, TVariables>;
  /** Returns null for a broken snapshot (missing id); confirm then stays inert. */
  readonly buildVariables: (row: ExpenseConfirmRow) => TVariables | null;
  /** Server-localized success copy toasted after the mutation resolves. */
  readonly successMessage: string;
  /** Used only when the rejection carries no message of its own. */
  readonly fallbackErrorMessage: string;
  /**
   * Classifies rejections that must block the dialog with a persistent in-dialog
   * explanation (banner) instead of a dismissible error toast.
   */
  readonly isBlockingError: (error: unknown) => boolean;
  readonly onClose: () => void;
  readonly onDone: () => void;
}

export interface ExpenseConfirmAction {
  readonly busy: boolean;
  /** True after a blocking rejection; confirm stays inert until the dialog reopens. */
  readonly blocked: boolean;
  readonly confirm: () => void;
}

/**
 * Confirm semantics for the destructive expense dialogs: one write per dialog
 * session (double-click guard re-arms on failure), aggregate-safe cache
 * eviction, toast reporting, and a blocking state for guard rejections like
 * `EXPENSE_DELETE_VIA_UNPAY` that keep the dialog open as an explanation.
 */
export function useExpenseConfirmAction<TData, TVariables extends Record<string, unknown>>(
  options: UseExpenseConfirmActionOptions<TData, TVariables>
): ExpenseConfirmAction {
  const {
    open,
    row,
    document,
    buildVariables,
    successMessage,
    fallbackErrorMessage,
    isBlockingError,
    onClose,
    onDone,
  } = options;
  const client = useApolloClient();
  const notifications = useNotifications();
  const [runMutation, { loading }] = useMutation(document, {
    // Domain errors reject with CombinedGraphQLErrors carrying extensions.code.
    errorPolicy: "none",
  });
  const [blocked, setBlocked] = useState(false);

  const startedRef = useRef(false);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setBlocked(false);
  }
  useEffect(() => {
    // Each dialog session re-arms the one-shot confirm guard.
    if (open) startedRef.current = false;
  }, [open]);

  // The row prop can reshape mid-session; the ref keeps confirm() reading the
  // latest snapshot without re-subscribing the handler.
  const rowRef = useRef(row);
  useEffect(() => {
    rowRef.current = row;
  });

  const confirm = useCallback(() => {
    const run = async (): Promise<void> => {
      const currentRow = rowRef.current;
      if (currentRow === null || blocked || startedRef.current) return;
      const variables = buildVariables(currentRow);
      if (variables === null) return;
      startedRef.current = true;
      try {
        await runMutation({ variables });
      } catch (error: unknown) {
        startedRef.current = false;
        if (isBlockingError(error)) {
          setBlocked(true);
          return;
        }
        notifications.show(getGraphQLErrorMessage(error, fallbackErrorMessage), { severity: "error" });
        return;
      }
      client.cache.evict({ fieldName: EXPENSES_LIST_FIELD });
      client.cache.gc();
      notifications.show(successMessage, { severity: "success" });
      onDone();
      onClose();
    };
    void run();
  }, [
    blocked,
    runMutation,
    buildVariables,
    isBlockingError,
    client,
    notifications,
    successMessage,
    fallbackErrorMessage,
    onDone,
    onClose,
  ]);

  return { busy: loading, blocked, confirm };
}
