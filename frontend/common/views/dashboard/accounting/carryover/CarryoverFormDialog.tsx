"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, useWatch } from "react-hook-form";
import { DialogPresets } from "@/frontend/common/components/ui/dialog/dialogPresets";
import { AppDatePicker } from "@/frontend/common/components/ui/form/date";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect";
import { TeacherAutocomplete } from "@/frontend/common/components/ui/input/userSelect/TeacherAutocomplete";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";
import {
  CARRYOVER_NOTE_MAX_LENGTH,
  type CarryoverFormRow,
  useCarryoverFormViewModel,
} from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel";

/** HTML id of the dialog form so the submit button in DialogActions can target it. */
const FORM_ID = "carryover-form";

const FORM_GRID_SX = {
  display: "grid",
  gap: 2,
  pt: 1,
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
} as const;

const FULL_WIDTH_CELL_SX = { gridColumn: "1 / -1" } as const;

function toCurrencyOption(code: CurrencyCode | null): CurrencyOption | null {
  if (code === null) return null;
  return getCurrencyByCode(code) ?? null;
}

export interface CarryoverFormDialogProps {
  /** Whether the dialog is visible; every open starts a fresh form session. */
  readonly open: boolean;
  /** Carryover snapshot for edit mode; `null` opens the dialog in add mode. */
  readonly row: CarryoverFormRow | null;
  /** Close request raised by Cancel, Escape, backdrop click, or a successful write. */
  readonly onClose: () => void;
  /** Runs after a successful create/update so the host page can refresh its queries. */
  readonly onSaved?: () => void;
}

export function CarryoverFormDialog({ open, row, onClose, onSaved }: Readonly<CarryoverFormDialogProps>) {
  const viewModel = useCarryoverFormViewModel({ open, row, onClose, onSaved });
  const { form, labels } = viewModel;
  // The edit-mode teacher field is read-only, so its helper explains why.
  const teacherLockedHint = viewModel.isEdit ? labels.modal.form.teacherLockedHint : undefined;
  // The payable suffix mirrors the currency selection so the money amount is
  // never read without its unit.
  const selectedCurrencyCode = useWatch({ control: form.control, name: "teacherCurrency" });
  const payableEndAdornment =
    selectedCurrencyCode === null ? undefined : <InputAdornment position="end">{selectedCurrencyCode}</InputAdornment>;

  return (
    <Dialog {...DialogPresets.info} open={open} onClose={viewModel.submitting ? undefined : viewModel.onCancel}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 700 }}>
        {viewModel.title}
        <IconButton
          aria-label={viewModel.commonLabels.ariaClose}
          onClick={viewModel.onCancel}
          disabled={viewModel.submitting}
          size="small"
        >
          <CloseOutlinedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack
          id={FORM_ID}
          component="form"
          // Native constraint validation (required/min/max) would swallow the
          // submit event before the Zod resolver runs, so the form opts out and
          // surfaces the same rules as inline field errors instead.
          noValidate
          sx={FORM_GRID_SX}
          onSubmit={event => {
            event.preventDefault();
            viewModel.onSubmit();
          }}
        >
          <Controller
            name="teacher"
            control={form.control}
            render={({ field, fieldState }) => (
              <TeacherAutocomplete
                value={field.value}
                onChange={field.onChange}
                label={labels.modal.form.teacher}
                placeholder={labels.modal.form.teacherPlaceholder}
                error={fieldState.error !== undefined}
                helperText={fieldState.error?.message ?? teacherLockedHint}
                disabled={viewModel.isEdit || viewModel.submitting}
                required
                fullWidth
              />
            )}
          />
          <Controller
            name="teacherCurrency"
            control={form.control}
            render={({ field, fieldState }) => (
              <CurrencySelect
                currency={toCurrencyOption(field.value)}
                setCurrencyAction={selected => field.onChange(selected.code)}
                onBlurAction={field.onBlur}
                label={labels.modal.form.currency}
                error={fieldState.error !== undefined}
                helperText={fieldState.error?.message}
                disabled={viewModel.submitting}
                // No `required`: CurrencySelect eagerly renders an error state
                // whenever required && no selection, bypassing the form's
                // submit-gated validation. RHF consumers omit it; the resolver
                // surfaces the required error on submit via error/helperText.
                fullWidth
              />
            )}
          />
          <Controller
            name="fromDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <AppDatePicker
                label={labels.modal.form.fromDate}
                value={field.value}
                onChange={field.onChange}
                disabled={viewModel.submitting}
                slotProps={{
                  textField: {
                    required: true,
                    fullWidth: true,
                    error: fieldState.error !== undefined,
                    helperText: fieldState.error?.message,
                  },
                }}
              />
            )}
          />
          <Controller
            name="toDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <AppDatePicker
                label={labels.modal.form.toDate}
                value={field.value}
                onChange={field.onChange}
                disabled={viewModel.submitting}
                slotProps={{
                  textField: {
                    required: true,
                    fullWidth: true,
                    error: fieldState.error !== undefined,
                    helperText: fieldState.error?.message,
                  },
                }}
              />
            )}
          />
          <Controller
            name="payable"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="number"
                label={labels.modal.form.payable}
                required
                fullWidth
                disabled={viewModel.submitting}
                error={fieldState.error !== undefined}
                helperText={fieldState.error?.message}
                aria-invalid={fieldState.error !== undefined}
                slotProps={{ htmlInput: { min: 0, step: "any" }, input: { endAdornment: payableEndAdornment } }}
              />
            )}
          />
          <Controller
            name="studentsCount"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="number"
                label={labels.modal.form.studentsCount}
                fullWidth
                disabled={viewModel.submitting}
                error={fieldState.error !== undefined}
                helperText={fieldState.error?.message ?? labels.modal.form.studentsAutoFilledHelper}
                aria-invalid={fieldState.error !== undefined}
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
              />
            )}
          />
          <Controller
            name="studentsText"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label={labels.modal.form.studentsText}
                fullWidth
                disabled={viewModel.submitting}
                error={fieldState.error !== undefined}
                helperText={fieldState.error?.message}
                aria-invalid={fieldState.error !== undefined}
                sx={FULL_WIDTH_CELL_SX}
              />
            )}
          />
          <Stack sx={FULL_WIDTH_CELL_SX}>
            <Controller
              name="note"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  multiline
                  minRows={3}
                  label={labels.modal.form.note}
                  placeholder={labels.modal.form.notePlaceholder}
                  fullWidth
                  disabled={viewModel.submitting}
                  error={fieldState.error !== undefined}
                  helperText={fieldState.error?.message}
                  aria-invalid={fieldState.error !== undefined}
                  slotProps={{ htmlInput: { maxLength: CARRYOVER_NOTE_MAX_LENGTH } }}
                />
              )}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          variant="text"
          onClick={viewModel.onCancel}
          disabled={viewModel.submitting}
          sx={theme => ({ color: theme.palette.text.secondary, fontWeight: 700, borderRadius: 1.5 })}
        >
          {labels.modal.form.cancel}
        </Button>
        <Button
          type="submit"
          form={FORM_ID}
          variant="contained"
          disabled={viewModel.submitting || !viewModel.canSubmit}
          aria-busy={viewModel.submitting}
          sx={{ fontWeight: 700, borderRadius: 1.5 }}
        >
          {viewModel.submitting ? <CircularProgress size={20} color="inherit" /> : labels.modal.form.submit}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
