"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Alert, Box, Dialog, DialogContent, DialogTitle, IconButton, Stack, TextField } from "@mui/material";
import { DialogPresets } from "@/frontend/common/components/ui/dialog/dialogPresets";
import { AppDatePicker } from "@/frontend/common/components/ui/form/date";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { BulkToExpenseActions } from "@/frontend/common/views/dashboard/accounting/carryover/BulkToExpenseModal.actions";
import {
  type BulkToExpenseRow,
  DATE_PAIR_SX,
  EXPENSE_MONTH_FORMAT,
  FORM_ID,
  isValidDate,
  PAYMENT_DATE_FORMAT,
  summarizeSelection,
} from "@/frontend/common/views/dashboard/accounting/carryover/BulkToExpenseModal.helpers";
import {
  useBulkToExpenseState,
  useBulkToExpenseSubmit,
} from "@/frontend/common/views/dashboard/accounting/carryover/BulkToExpenseModal.hooks";
import { CARRYOVER_NOTE_MAX_LENGTH } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel";

export interface BulkToExpenseModalProps {
  /** Whether the dialog is visible; every open starts a fresh session. */
  readonly open: boolean;
  /** Ids of the carryovers selected for conversion. */
  readonly carryoverIds: readonly string[];
  /** Row snapshots for the selected carryovers, used to compute the total and currency summary. */
  readonly rows: readonly BulkToExpenseRow[];
  /** Close request raised by Cancel, Escape, backdrop click, or a successful conversion. */
  readonly onClose: () => void;
  /** Runs after a successful conversion so the host page can refresh its queries. */
  readonly onDone?: () => void;
}

export function BulkToExpenseModal({ open, carryoverIds, rows, onClose, onDone }: Readonly<BulkToExpenseModalProps>) {
  const locale = useAppLocale();
  const state = useBulkToExpenseState(open);
  const {
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
  } = state;
  const { labels, commonLabels, submitting, handleSubmit } = useBulkToExpenseSubmit({
    carryoverIds,
    paymentDate,
    expenseMonth,
    note,
    clientRequestIdRef,
    submittedTokenRef,
    setAlreadyPaidRejected,
    onClose,
    onDone,
  });

  const summary = summarizeSelection(carryoverIds, rows, locale);
  const canSubmit =
    isValidDate(paymentDate) && isValidDate(expenseMonth) && carryoverIds.length > 0 && !alreadyPaidRejected;

  const handlePaymentDateChange = (value: Date | null) => {
    setPaymentDate(value);
    // The expense month almost always matches the payment month, so a freshly
    // picked payment date pre-seeds the still-empty month picker.
    if (isValidDate(value)) {
      setExpenseMonth(current => current ?? value);
    }
  };

  return (
    <Dialog {...DialogPresets.info} open={open} onClose={submitting ? undefined : onClose}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 700 }}>
        {labels.modal.bulkToExpense.title}
        <IconButton aria-label={commonLabels.ariaClose} onClick={onClose} disabled={submitting} size="small">
          <CloseOutlinedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack
          id={FORM_ID}
          component="form"
          // The submit gate (both dates valid) is enforced on the button, so the
          // form opts out of native constraint validation.
          noValidate
          sx={{ gap: 3, pt: 1 }}
          onSubmit={event => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          {alreadyPaidRejected ? <Alert severity="error">{labels.error.alreadyPaid}</Alert> : null}
          {summary.count > 0 ? (
            <Alert severity="info" icon={<InfoOutlinedIcon fontSize="small" />}>
              {labels.modal.bulkToExpense.summary(summary.count, summary.totalAmount, summary.currency ?? "—")}
            </Alert>
          ) : null}
          <Box sx={DATE_PAIR_SX}>
            <AppDatePicker
              label={labels.modal.bulkToExpense.paymentDate}
              value={paymentDate}
              onChange={handlePaymentDateChange}
              format={PAYMENT_DATE_FORMAT}
              disabled={submitting}
              slotProps={{ textField: { required: true, fullWidth: true } }}
            />
            <AppDatePicker
              label={labels.modal.bulkToExpense.expenseDate}
              value={expenseMonth}
              onChange={setExpenseMonth}
              views={["year", "month"]}
              openTo="month"
              format={EXPENSE_MONTH_FORMAT}
              disabled={submitting}
              slotProps={{ textField: { required: true, fullWidth: true } }}
            />
          </Box>
          <TextField
            multiline
            minRows={2}
            label={labels.modal.bulkToExpense.note}
            placeholder={labels.modal.bulkToExpense.notePlaceholder}
            value={note}
            onChange={event => setNote(event.target.value)}
            fullWidth
            disabled={submitting}
            slotProps={{ htmlInput: { maxLength: CARRYOVER_NOTE_MAX_LENGTH }, inputLabel: { shrink: true } }}
          />
          <Alert severity="warning">{labels.modal.bulkToExpense.convertConsequenceWarning}</Alert>
        </Stack>
      </DialogContent>
      <BulkToExpenseActions canSubmit={canSubmit} submitting={submitting} onClose={onClose} labels={labels} />
    </Dialog>
  );
}
