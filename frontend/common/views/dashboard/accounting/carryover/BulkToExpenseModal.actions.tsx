"use client";

import { CircularProgress, DialogActions, Typography } from "@mui/material";
import { FilterButton, PrimaryPageAction } from "@/frontend/common/components/ui";
import { FORM_ID } from "@/frontend/common/views/dashboard/accounting/carryover/BulkToExpenseModal.helpers";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

interface BulkToExpenseActionsProps {
  /** Whether both dates are valid and no rejection blocks submission. */
  readonly canSubmit: boolean;
  readonly submitting: boolean;
  readonly onClose: () => void;
  readonly labels: CarryoverLabels;
}

/** Dialog footer: the fill-required hint, Cancel, and the form-submitting button. */
export function BulkToExpenseActions({ canSubmit, submitting, onClose, labels }: Readonly<BulkToExpenseActionsProps>) {
  return (
    <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
      {!canSubmit && !submitting ? (
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.text.secondary, me: "auto" })}>
          {labels.modal.bulkToExpense.convertFillRequiredHint}
        </Typography>
      ) : null}
      <FilterButton onClick={onClose} disabled={submitting}>
        {labels.modal.bulkToExpense.cancel}
      </FilterButton>
      <PrimaryPageAction type="submit" form={FORM_ID} disabled={submitting || !canSubmit} aria-busy={submitting}>
        {submitting ? <CircularProgress size={20} color="inherit" /> : labels.modal.bulkToExpense.submit}
      </PrimaryPageAction>
    </DialogActions>
  );
}
