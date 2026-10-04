"use client";

import { useMutation } from "@apollo/client/react";
import { Box } from "@mui/material";
import { useCallback, useMemo } from "react";
import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog";
import { bulkDeleteExpensesMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useBulkDeleteConfirm } from "@/frontend/common/views/dashboard/accounting/__shared__";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import {
  type ConfirmSummaryDetail,
  ConfirmSummaryDetails,
} from "@/frontend/common/views/dashboard/accounting/components/ConfirmSummaryDetails";
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
function buildBulkDeleteDetails(rows: readonly ExpenseConfirmRow[]): ConfirmSummaryDetail[] {
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
  const [runMutation, { loading }] = useMutation(bulkDeleteExpensesMutationDocument, {
    // Domain errors reject with CombinedGraphQLErrors carrying extensions.code.
    errorPolicy: "none",
  });
  const run = useCallback(
    (ids: string[]) => runMutation({ variables: { input: { ids, reason: null } } }),
    [runMutation]
  );
  const details = useMemo(() => buildBulkDeleteDetails(rows), [rows]);
  const { confirm, ids } = useBulkDeleteConfirm({
    open,
    rows,
    run,
    evictFieldName: EXPENSES_LIST_FIELD,
    successMessage: labels.success.bulkDeleted,
    operationFailedLabel: commonLabels.operationFailed,
    onDone,
    onClose,
  });

  return (
    <BaseDeleteDialog
      open={open}
      isLoading={loading}
      title={labels.modal.bulkDelete.title(ids.length)}
      body=""
      cancelLabel={labels.modal.bulkDelete.cancel}
      confirmLabel={labels.modal.bulkDelete.confirm}
      closeAriaLabel={commonLabels.ariaClose}
      onClose={onClose}
      onConfirm={confirm}
    >
      <Box sx={{ pt: 1 }}>
        <ConfirmSummaryDetails details={details} />
      </Box>
    </BaseDeleteDialog>
  );
}
