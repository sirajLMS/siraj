"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { CircularProgress, DialogActions, DialogTitle, IconButton, Stack, TextField, Typography } from "@mui/material";
import { Controller } from "react-hook-form";
import { FilterButton, PrimaryPageAction } from "@/frontend/common/components/ui";
import {
  EXPENSE_FORM_ID,
  EXPENSE_FULL_WIDTH_CELL_SX,
  type ExpenseFormControl,
} from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseFormDialog.helpers";
import { EXPENSE_NOTE_MAX_LENGTH } from "@/frontend/common/views/dashboard/accounting/expenses/useExpenseFormViewModel";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

interface NoteFieldProps {
  readonly control: ExpenseFormControl;
  readonly labels: ExpensesLabels;
  readonly submitting: boolean;
}

export function NoteField({ control, labels, submitting }: Readonly<NoteFieldProps>) {
  return (
    <Stack sx={EXPENSE_FULL_WIDTH_CELL_SX}>
      <Controller
        name="note"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            multiline
            minRows={3}
            label={labels.modal.form.note}
            fullWidth
            disabled={submitting}
            error={fieldState.error !== undefined}
            helperText={fieldState.error?.message}
            aria-invalid={fieldState.error !== undefined}
            slotProps={{ htmlInput: { maxLength: EXPENSE_NOTE_MAX_LENGTH } }}
          />
        )}
      />
    </Stack>
  );
}

interface ExpenseSourceBannerProps {
  readonly labels: ExpensesLabels;
}

export function ExpenseSourceBanner({ labels }: Readonly<ExpenseSourceBannerProps>) {
  return (
    <Stack
      direction="row"
      sx={theme => ({
        gridColumn: "1 / -1",
        gap: 1,
        alignItems: "center",
        color: theme.palette.onSurfaceVariant,
      })}
    >
      <InfoOutlinedIcon fontSize="small" aria-hidden />
      <Typography variant="bodyMd">{labels.modal.form.sourceBanner(labels.source.Manual)}</Typography>
    </Stack>
  );
}

interface ExpenseDialogHeaderProps {
  readonly title: string;
  readonly closeLabel: string;
  readonly submitting: boolean;
  readonly onCancel: () => void;
}

export function ExpenseDialogHeader({ title, closeLabel, submitting, onCancel }: Readonly<ExpenseDialogHeaderProps>) {
  return (
    <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 700 }}>
      {title}
      <IconButton aria-label={closeLabel} onClick={onCancel} disabled={submitting} size="small">
        <CloseOutlinedIcon fontSize="small" />
      </IconButton>
    </DialogTitle>
  );
}

interface ExpenseDialogFooterProps {
  readonly labels: ExpensesLabels;
  readonly submitting: boolean;
  readonly canSubmit: boolean;
  readonly onCancel: () => void;
}

export function ExpenseDialogFooter({ labels, submitting, canSubmit, onCancel }: Readonly<ExpenseDialogFooterProps>) {
  return (
    <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
      <FilterButton onClick={onCancel} disabled={submitting}>
        {labels.modal.form.cancel}
      </FilterButton>
      <PrimaryPageAction
        type="submit"
        form={EXPENSE_FORM_ID}
        disabled={submitting || !canSubmit}
        aria-busy={submitting}
      >
        {submitting ? <CircularProgress size={20} color="inherit" /> : labels.modal.form.submit}
      </PrimaryPageAction>
    </DialogActions>
  );
}
