"use client";

import { Dialog, DialogContent, InputAdornment, Stack } from "@mui/material";
import { useWatch } from "react-hook-form";
import { DialogPresets } from "@/frontend/common/components/ui/dialog/dialogPresets";
import { ExpenseType } from "@/frontend/common/graphql/generated/gql/graphql";
import { ExpenseDateFields } from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseFormDialog.dates";
import { TypeField, ValueField } from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseFormDialog.fields";
import {
  EXPENSE_FORM_GRID_SX,
  EXPENSE_FORM_ID,
} from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseFormDialog.helpers";
import {
  CurrencyField,
  TeacherField,
  TitleField,
} from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseFormDialog.identity";
import {
  ExpenseDialogFooter,
  ExpenseDialogHeader,
  ExpenseSourceBanner,
  NoteField,
} from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseFormDialog.parts";
import {
  type ExpenseFormRow,
  useExpenseFormViewModel,
} from "@/frontend/common/views/dashboard/accounting/expenses/useExpenseFormViewModel";

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
      <ExpenseDialogHeader
        title={viewModel.title}
        closeLabel={viewModel.commonLabels.ariaClose}
        submitting={viewModel.submitting}
        onCancel={viewModel.onCancel}
      />
      <DialogContent>
        <Stack
          id={EXPENSE_FORM_ID}
          component="form"
          // Native constraint validation (required/minLength) would swallow the
          // submit event before the Zod resolver runs, so the form opts out and
          // surfaces the same rules as inline field errors instead.
          noValidate
          sx={EXPENSE_FORM_GRID_SX}
          onSubmit={event => {
            event.preventDefault();
            viewModel.onSubmit();
          }}
        >
          <TitleField control={form.control} labels={labels} submitting={viewModel.submitting} />
          <TypeField
            control={form.control}
            labels={labels}
            labelsByType={labelsByType}
            typeHint={typeHint}
            submitting={viewModel.submitting}
            salariesLocked={viewModel.salariesLocked}
          />
          <TeacherField control={form.control} labels={labels} submitting={viewModel.submitting} />
          <ValueField
            control={form.control}
            labels={labels}
            valueHint={valueHint}
            valueEndAdornment={valueEndAdornment}
            submitting={viewModel.submitting}
            salariesLocked={viewModel.salariesLocked}
          />
          <CurrencyField control={form.control} labels={labels} submitting={viewModel.submitting} />
          <ExpenseDateFields control={form.control} labels={labels} submitting={viewModel.submitting} />
          <NoteField control={form.control} labels={labels} submitting={viewModel.submitting} />
          {!viewModel.isEdit && <ExpenseSourceBanner labels={labels} />}
        </Stack>
      </DialogContent>
      <ExpenseDialogFooter
        labels={labels}
        submitting={viewModel.submitting}
        canSubmit={viewModel.canSubmit}
        onCancel={viewModel.onCancel}
      />
    </Dialog>
  );
}
