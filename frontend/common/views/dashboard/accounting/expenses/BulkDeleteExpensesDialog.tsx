"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { Box } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { bulkDeleteExpensesMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { getGraphQLErrorMessage } from "@/frontend/common/utils/errorUtils";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import {
  type CarryoverConfirmDetail,
  CarryoverConfirmDetails,
  CarryoverConfirmScaffold,
} from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverConfirmScaffold";
import type { ExpenseConfirmRow } from "@/frontend/common/views/dashboard/accounting/expenses/useExpenseConfirmAction";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingExpenses, Translation } from "@/shared/locale/namespaces";

/** Root field holding the expense list page; dropped after writes because aggregates depend on every row. */
const EXPENSES_LIST_FIELD = "expenses";

export interface BulkDeleteExpensesDialogProps {
  readonly open: boolean;
  /** Selected rows restated in the confirmation; the mutation removes all of them atomically. */
  readonly rows: readonly ExpenseConfirmRow[];
  readonly onClose: () => void;
  /** Runs after a successful bulk delete so the host can reset its selection state. */
  readonly onDone: () => void;
}

/** Restates each targeted expense as a title + amount line in the confirm summary. */
function buildBulkDeleteDetails(rows: readonly ExpenseConfirmRow[]): CarryoverConfirmDetail[] {
  return rows.map(row => ({
    label: row.title ?? "—",
    value: `${formatAccountingMoney(row.expenseValue)} ${row.expenseCurrency ?? ""}`.trim(),
  }));
}

/**
 * Multi-row variant of the delete confirmation: the server applies the batch in
 * one transaction and rejects the whole call when any row is protected (e.g.
 * a paid carryover-settlement salary expense via `EXPENSE_DELETE_VIA_UNPAY`),
 * in which case the localized server message is toasted and nothing is deleted.
 */
export function BulkDeleteExpensesDialog({ open, rows, onClose, onDone }: Readonly<BulkDeleteExpensesDialogProps>) {
  const labels = useAppTranslation(DashboardAccountingExpenses);
  const commonLabels = useAppTranslation(Translation.Common);
  const client = useApolloClient();
  const notifications = useNotifications();
  const [runMutation, { loading }] = useMutation(bulkDeleteExpensesMutationDocument, {
    // Domain errors reject with CombinedGraphQLErrors carrying extensions.code.
    errorPolicy: "none",
  });
  const ids = useMemo(() => rows.map(row => row.id).filter((id): id is string => id !== null), [rows]);
  const details = useMemo(() => buildBulkDeleteDetails(rows), [rows]);

  const startedRef = useRef(false);
  useEffect(() => {
    if (open) startedRef.current = false;
  }, [open]);

  const confirm = useCallback(() => {
    const run = async (): Promise<void> => {
      if (startedRef.current || ids.length === 0) return;
      startedRef.current = true;
      try {
        await runMutation({ variables: { input: { ids, reason: null } } });
      } catch (error: unknown) {
        startedRef.current = false;
        notifications.show(getGraphQLErrorMessage(error, commonLabels.operationFailed), { severity: "error" });
        return;
      }
      client.cache.evict({ fieldName: EXPENSES_LIST_FIELD });
      client.cache.gc();
      notifications.show(labels.success.bulkDeleted(ids.length), { severity: "success" });
      onDone();
      onClose();
    };
    void run();
  }, [ids, runMutation, client, notifications, labels, commonLabels, onDone, onClose]);

  return (
    <CarryoverConfirmScaffold
      open={open}
      busy={loading}
      title={labels.modal.bulkDelete.title(ids.length)}
      cancelLabel={labels.modal.bulkDelete.cancel}
      confirmLabel={labels.modal.bulkDelete.confirm}
      closeAriaLabel={commonLabels.ariaClose}
      onClose={onClose}
      onConfirm={confirm}
    >
      <Box sx={{ pt: 1 }}>
        <CarryoverConfirmDetails details={details} />
      </Box>
    </CarryoverConfirmScaffold>
  );
}
