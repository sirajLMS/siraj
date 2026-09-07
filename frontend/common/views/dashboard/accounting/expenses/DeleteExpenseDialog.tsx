"use client";

import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import { Box, TextField, Typography } from "@mui/material";
import { useCallback, useState } from "react";
import { deleteExpenseMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import { CarryoverConfirmScaffold } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverConfirmScaffold";
import {
  type ExpenseConfirmRow,
  isExpenseDeleteViaUnpayError,
  useExpenseConfirmAction,
} from "@/frontend/common/views/dashboard/accounting/expenses/useExpenseConfirmAction";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingExpenses, Translation } from "@/shared/locale/namespaces";

/** Mirrors the `deletedReason` column ceiling enforced by the backend. */
const DELETE_REASON_MAX_LENGTH = 500;

export interface DeleteExpenseDialogProps {
  readonly open: boolean;
  /** Row snapshot the confirmation restates; `null` keeps the confirm action inert. */
  readonly row: ExpenseConfirmRow | null;
  /** Close request raised by Cancel, Escape, backdrop click, or a successful delete. */
  readonly onClose: () => void;
  /** Runs after a successful delete so the host page can reset row state. */
  readonly onDone: () => void;
}

/**
 * Single-row delete confirmation for the expense ledger: restates the title and
 * amount, collects an optional audit reason, and soft-deletes via
 * `deleteExpense`. When the row is a paid carryover-settlement salary expense,
 * the server rejects with `EXPENSE_DELETE_VIA_UNPAY`; that rejection is shown
 * as a persistent in-dialog banner (no dismiss affordance, confirm disabled)
 * directing the operator to the carryover Unpay flow instead of closing.
 */
export function DeleteExpenseDialog({ open, row, onClose, onDone }: Readonly<DeleteExpenseDialogProps>) {
  const labels = useAppTranslation(DashboardAccountingExpenses);
  const commonLabels = useAppTranslation(Translation.Common);

  // Optional audit reason; each dialog session starts blank. The render-time
  // open-transition reset avoids a setState-in-effect double render.
  const [reason, setReason] = useState("");
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setReason("");
  }

  const buildVariables = useCallback(
    (target: ExpenseConfirmRow) => {
      if (target.id === null) return null;
      const trimmedReason = reason.trim();
      return { input: { id: target.id, reason: trimmedReason === "" ? null : trimmedReason } };
    },
    [reason]
  );

  const action = useExpenseConfirmAction({
    open,
    row,
    document: deleteExpenseMutationDocument,
    buildVariables,
    successMessage: labels.success.deleted,
    fallbackErrorMessage: commonLabels.operationFailed,
    isBlockingError: isExpenseDeleteViaUnpayError,
    onClose,
    onDone,
  });

  // Restate the target as "title (value currency)"; a null session keeps the copy inert.
  const summary =
    row === null
      ? "—"
      : labels.modal.delete.summary(
          row.title ?? "—",
          formatAccountingMoney(row.expenseValue),
          row.expenseCurrency ?? ""
        );

  return (
    <CarryoverConfirmScaffold
      open={open}
      busy={action.busy}
      title={labels.modal.delete.title}
      cancelLabel={labels.modal.delete.cancel}
      confirmLabel={labels.modal.delete.confirm}
      closeAriaLabel={commonLabels.ariaClose}
      confirmDisabled={action.blocked}
      onClose={onClose}
      onConfirm={action.confirm}
    >
      <Box sx={{ display: "grid", gap: 2, pt: 1 }}>
        <Typography variant="bodyMd">{summary}</Typography>
        {action.blocked && (
          <Box
            role="alert"
            sx={theme => ({
              display: "flex",
              gap: 1,
              p: 1.5,
              borderRadius: 1.5,
              backgroundColor: theme.palette.errorContainer,
              color: theme.palette.onErrorContainer,
            })}
          >
            <ErrorOutlinedIcon fontSize="small" aria-hidden />
            <Typography variant="bodyMd">{labels.error.deleteViaUnpay}</Typography>
          </Box>
        )}
        <TextField
          value={reason}
          onChange={event => setReason(event.target.value)}
          multiline
          minRows={2}
          label={labels.modal.delete.reason}
          placeholder={labels.modal.delete.reasonPlaceholder}
          fullWidth
          disabled={action.busy || action.blocked}
          slotProps={{ htmlInput: { maxLength: DELETE_REASON_MAX_LENGTH } }}
        />
      </Box>
    </CarryoverConfirmScaffold>
  );
}
