"use client";

import type { TypedDocumentNode } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useEffect, useRef } from "react";
import type { CarryoverBalanceQuery_carryoverBalance } from "@/frontend/common/graphql/generated/gql/graphql";
import { getGraphQLErrorMessage } from "@/frontend/common/utils/errorUtils";

/** Root field holding the carryover list page; dropped after writes because aggregates depend on every row. */
const CARRYOVER_LIST_FIELD = "carryoverBalances";

/**
 * Row snapshot the carryover confirm dialogs operate on. Grid rows satisfy
 * this shape directly; `linkedSessionCount` stays optional because the list
 * selection does not expose it yet, so hosts pass it only when it is known
 * ahead of time.
 */
export type CarryoverConfirmRow = Pick<
  CarryoverBalanceQuery_carryoverBalance,
  "id" | "teacherName" | "payable" | "teacherCurrency" | "paymentDate" | "expenseId"
> & {
  readonly linkedSessionCount?: number | null;
};

export interface UseCarryoverConfirmActionOptions<TData, TVariables extends Record<string, unknown>> {
  readonly open: boolean;
  readonly row: CarryoverConfirmRow | null;
  readonly document: TypedDocumentNode<TData, TVariables>;
  /** Returns null for a broken snapshot (missing id); confirm then stays inert. */
  readonly buildVariables: (row: CarryoverConfirmRow) => TVariables | null;
  /** Server-localized success copy toasted after the mutation resolves. */
  readonly successMessage: string;
  /** Used only when the rejection carries no message of its own. */
  readonly fallbackErrorMessage: string;
  readonly onClose: () => void;
  readonly onDone: () => void;
}

export interface CarryoverConfirmAction {
  readonly busy: boolean;
  readonly confirm: () => void;
}

/**
 * Shared confirm semantics for the destructive carryover dialogs: one write per
 * dialog session (double-click guard re-arms on failure), aggregate-safe cache
 * eviction, and toast reporting. Delete and unpay differ only in document and
 * variable shape.
 */
export function useCarryoverConfirmAction<TData, TVariables extends Record<string, unknown>>(
  options: UseCarryoverConfirmActionOptions<TData, TVariables>
): CarryoverConfirmAction {
  const { open, row, document, buildVariables, successMessage, fallbackErrorMessage, onClose, onDone } = options;
  const client = useApolloClient();
  const notifications = useNotifications();
  const [runMutation, { loading }] = useMutation(document, {
    // Domain errors reject with CombinedGraphQLErrors carrying extensions.code.
    errorPolicy: "none",
  });

  // The row prop can reshape mid-session; the ref keeps confirm() reading the
  // latest snapshot without re-subscribing the handler.
  const rowRef = useRef(row);
  useEffect(() => {
    rowRef.current = row;
  });

  const startedRef = useRef(false);
  useEffect(() => {
    if (open) startedRef.current = false;
  }, [open]);

  const confirm = useCallback(() => {
    const run = async (): Promise<void> => {
      const currentRow = rowRef.current;
      if (currentRow === null || startedRef.current) return;
      const variables = buildVariables(currentRow);
      if (variables === null) return;
      startedRef.current = true;
      try {
        await runMutation({ variables });
      } catch (error: unknown) {
        startedRef.current = false;
        notifications.show(getGraphQLErrorMessage(error, fallbackErrorMessage), { severity: "error" });
        return;
      }
      client.cache.evict({ fieldName: CARRYOVER_LIST_FIELD });
      client.cache.gc();
      notifications.show(successMessage, { severity: "success" });
      onDone();
      onClose();
    };
    void run();
  }, [runMutation, buildVariables, client, notifications, successMessage, fallbackErrorMessage, onDone, onClose]);

  return { busy: loading, confirm };
}
