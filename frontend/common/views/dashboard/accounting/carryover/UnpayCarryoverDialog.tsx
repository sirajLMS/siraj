"use client";

import { Stack, TextField } from "@mui/material";
import { useCallback, useState } from "react";
import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog";
import { unpayCarryoverBalanceMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import {
  formatAccountingDate,
  formatAccountingMoney,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import {
  type CarryoverConfirmRow,
  useCarryoverConfirmAction,
} from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverConfirmAction";
import { CARRYOVER_NOTE_MAX_LENGTH } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel";
import {
  type ConfirmSummaryDetail,
  ConfirmSummaryDetails,
} from "@/frontend/common/views/dashboard/accounting/components/ConfirmSummaryDetails";
import { useAppTranslation } from "@/shared/locale/client";
import { useAppLocale } from "@/shared/locale/localeContext";
import { DashboardAccountingCarryover, Translation } from "@/shared/locale/namespaces";

export interface UnpayCarryoverDialogProps {
  readonly open: boolean;
  /** Row snapshot the confirmation restates; expected to be a paid carryover. */
  readonly row: CarryoverConfirmRow | null;
  /** Close request raised by Cancel, Escape, backdrop click, or a successful unpay. */
  readonly onClose: () => void;
  /** Runs after a successful unpay so the host page can reset row state. */
  readonly onDone: () => void;
}

export function UnpayCarryoverDialog({ open, row, onClose, onDone }: Readonly<UnpayCarryoverDialogProps>) {
  const labels = useAppTranslation(DashboardAccountingCarryover);
  const commonLabels = useAppTranslation(Translation.Common);
  const locale = useAppLocale();

  // Optional audit-trail note; each dialog session starts blank. The render-time
  // open-transition reset avoids a setState-in-effect double render.
  const [note, setNote] = useState("");
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setNote("");
  }

  const buildVariables = useCallback(
    (target: CarryoverConfirmRow) => {
      if (target.id === null) return null;
      return { id: target.id, note: note.trim() === "" ? null : note.trim() };
    },
    [note]
  );

  const action = useCarryoverConfirmAction({
    open,
    row,
    document: unpayCarryoverBalanceMutationDocument,
    buildVariables,
    successMessage: labels.success.unpaid,
    fallbackErrorMessage: commonLabels.operationFailed,
    onClose,
    onDone,
  });

  const details: ConfirmSummaryDetail[] = [
    { label: labels.column.teacher, value: row?.teacherName ?? "—" },
    {
      label: labels.column.payable,
      value: row === null ? "—" : `${formatAccountingMoney(row.payable)} ${row.teacherCurrency ?? ""}`.trim(),
    },
  ];
  if (row?.paymentDate) {
    details.push({
      label: labels.column.paymentDate,
      value: formatAccountingDate(row.paymentDate, locale),
    });
  }
  if (row?.expenseId) {
    details.push({ label: labels.modal.unpay.expenseLabel, value: row.expenseId });
  }

  return (
    <BaseDeleteDialog
      open={open}
      isLoading={action.busy}
      title={labels.modal.unpay.title}
      body={labels.modal.unpay.warning}
      cancelLabel={labels.modal.unpay.cancel}
      confirmLabel={labels.modal.unpay.confirm}
      onClose={onClose}
      onConfirm={action.confirm}
    >
      <Stack sx={{ gap: 2 }}>
        <ConfirmSummaryDetails details={details} />
        <TextField
          value={note}
          onChange={event => setNote(event.target.value)}
          multiline
          minRows={2}
          label={labels.modal.unpay.note}
          placeholder={labels.modal.unpay.notePlaceholder}
          fullWidth
          disabled={action.busy}
          slotProps={{ htmlInput: { maxLength: CARRYOVER_NOTE_MAX_LENGTH } }}
        />
      </Stack>
    </BaseDeleteDialog>
  );
}
