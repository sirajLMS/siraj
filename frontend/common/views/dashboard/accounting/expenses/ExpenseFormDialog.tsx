"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useWatch } from "react-hook-form";
import { DialogPresets } from "@/frontend/common/components/ui/dialog/dialogPresets";
import { AppDatePicker } from "@/frontend/common/components/ui/form/date";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect";
import { TeacherAutocomplete } from "@/frontend/common/components/ui/input/userSelect/TeacherAutocomplete";
import { type CurrencyCode, ExpenseType } from "@/frontend/common/graphql/generated/gql/graphql";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";
import {
  EXPENSE_NOTE_MAX_LENGTH,
  EXPENSE_TITLE_MAX_LENGTH,
  type ExpenseFormRow,
  useExpenseFormViewModel,
} from "@/frontend/common/views/dashboard/accounting/expenses/useExpenseFormViewModel";

/** HTML id of the dialog form so the submit button in DialogActions can target it. */
const FORM_ID = "expense-form";

const FORM_GRID_SX = {
  display: "grid",
  gap: 2,
  pt: 1,
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
} as const;

const FULL_WIDTH_CELL_SX = { gridColumn: "1 / -1" } as const;

/**
 * All selectable expense types; Salaries stays listed but disabled because
 * the create contract rejects it — salaries are written only by the carryover
 * settlement flow, and the disabled row with the hint explains where.
 */
const EXPENSE_TYPES: readonly ExpenseType[] = Object.values(ExpenseType);

function toCurrencyOption(code: CurrencyCode | null): CurrencyOption | null {
  if (code === null) return null;
  return getCurrencyByCode(code) ?? null;
}

function isExpenseType(value: unknown): value is ExpenseType {
  return typeof value === "string" && (EXPENSE_TYPES as readonly string[]).includes(value);
}

export interface ExpenseFormDialogProps {
  /** Whether the dialog is visible; every open starts a fresh form session. */
  readonly open: boolean;
  /** Expense snapshot for edit mode; `null` opens the dialog in add mode. */
  readonly row: ExpenseFormRow | null;
  /** Close request raised by Cancel, Escape, backdrop click, or a successful write. */
  readonly onClose: () => void;
  /** Runs after a successful create/update so the host page can refresh its queries. */
  readonly onSaved?: () => void;
}

export function ExpenseFormDialog({ open, row, onClose, onSaved }: Readonly<ExpenseFormDialogProps>) {
  const viewModel = useExpenseFormViewModel({ open, row, onClose, onSaved });
  const { form, labels } = viewModel;

  const labelsByType: Record<ExpenseType, string> = {
    [ExpenseType.Salaries]: labels.type.Salaries,
    [ExpenseType.Marketing]: labels.type.Marketing,
    [ExpenseType.Logistics]: labels.type.Logistics,
    [ExpenseType.Technology]: labels.type.Technology,
  };

  // The value suffix mirrors the currency selection so the money amount is
  // never read without its unit.
  const selectedCurrencyCode = useWatch({ control: form.control, name: "expenseCurrency" });
  const valueEndAdornment =
    selectedCurrencyCode === null ? undefined : <InputAdornment position="end">{selectedCurrencyCode}</InputAdornment>;

  // In add mode the select explains why Salaries cannot be picked; when
  // editing a Salaries row the locked type/value fields carry the hint instead.
  const typeHint = viewModel.salariesLocked ? labels.error.typeImmutableForSalaries : labels.modal.form.salariesHint;
  const valueHint = viewModel.salariesLocked ? labels.error.valueImmutableForSalaries : undefined;

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
          // Native constraint validation (required/minLength) would swallow the
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
            name="title"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label={labels.modal.form.title}
                required
                fullWidth
                disabled={viewModel.submitting}
                error={fieldState.error !== undefined}
                helperText={fieldState.error?.message}
                aria-invalid={fieldState.error !== undefined}
                slotProps={{ htmlInput: { maxLength: EXPENSE_TITLE_MAX_LENGTH } }}
                sx={FULL_WIDTH_CELL_SX}
              />
            )}
          />
          <Controller
            name="type"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormControl
                required
                fullWidth
                disabled={viewModel.submitting || viewModel.salariesLocked}
                error={fieldState.error !== undefined}
              >
                <InputLabel id="expense-type-label">{labels.modal.form.type}</InputLabel>
                <Select
                  labelId="expense-type-label"
                  label={labels.modal.form.type}
                  value={field.value ?? ""}
                  onBlur={field.onBlur}
                  onChange={(event: SelectChangeEvent) => {
                    const next: unknown = event.target.value;
                    if (next === "" || isExpenseType(next)) field.onChange(next === "" ? null : next);
                  }}
                  inputProps={{ "aria-invalid": fieldState.error !== undefined }}
                >
                  {EXPENSE_TYPES.map(type => (
                    <MenuItem key={type} value={type} disabled={type === ExpenseType.Salaries}>
                      {labelsByType[type]}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{fieldState.error?.message ?? typeHint}</FormHelperText>
              </FormControl>
            )}
          />
          <Controller
            name="teacher"
            control={form.control}
            render={({ field, fieldState }) => (
              <TeacherAutocomplete
                value={field.value}
                onChange={field.onChange}
                label={labels.modal.form.teacher}
                error={fieldState.error !== undefined}
                helperText={fieldState.error?.message}
                disabled={viewModel.submitting}
                fullWidth
              />
            )}
          />
          <Controller
            name="expenseValue"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="number"
                label={labels.modal.form.value}
                required
                fullWidth
                disabled={viewModel.submitting || viewModel.salariesLocked}
                error={fieldState.error !== undefined}
                helperText={fieldState.error?.message ?? valueHint}
                aria-invalid={fieldState.error !== undefined}
                slotProps={{ htmlInput: { min: 0, step: "any" }, input: { endAdornment: valueEndAdornment } }}
              />
            )}
          />
          <Controller
            name="expenseCurrency"
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
                required
                fullWidth
              />
            )}
          />
          <Controller
            name="paymentDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <AppDatePicker
                label={labels.modal.form.paymentDate}
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
            name="expenseMonth"
            control={form.control}
            render={({ field, fieldState }) => (
              <AppDatePicker
                label={labels.modal.form.expenseDate}
                value={field.value}
                onChange={field.onChange}
                views={["year", "month"]}
                openTo="month"
                format="yyyy-MM"
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
                  fullWidth
                  disabled={viewModel.submitting}
                  error={fieldState.error !== undefined}
                  helperText={fieldState.error?.message}
                  aria-invalid={fieldState.error !== undefined}
                  slotProps={{ htmlInput: { maxLength: EXPENSE_NOTE_MAX_LENGTH } }}
                />
              )}
            />
          </Stack>
          {!viewModel.isEdit && (
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
          )}
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
