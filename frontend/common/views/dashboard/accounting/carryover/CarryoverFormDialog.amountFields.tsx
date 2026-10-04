"use client";

import { Stack, TextField } from "@mui/material";
import type { ReactNode } from "react";
import { Controller } from "react-hook-form";
import { FULL_WIDTH_CELL_SX } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverFormDialog.constants";
import {
  CARRYOVER_NOTE_MAX_LENGTH,
  type CarryoverFormViewModel,
} from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

interface AmountFieldsProps {
  readonly form: CarryoverFormViewModel["form"];
  readonly labels: CarryoverLabels;
  readonly submitting: boolean;
  readonly payableEndAdornment: ReactNode;
}

export function CarryoverFormAmountFields({
  form,
  labels,
  submitting,
  payableEndAdornment,
}: Readonly<AmountFieldsProps>) {
  return (
    <>
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
            disabled={submitting}
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
            disabled={submitting}
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
            disabled={submitting}
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
              disabled={submitting}
              error={fieldState.error !== undefined}
              helperText={fieldState.error?.message}
              aria-invalid={fieldState.error !== undefined}
              slotProps={{ htmlInput: { maxLength: CARRYOVER_NOTE_MAX_LENGTH } }}
            />
          )}
        />
      </Stack>
    </>
  );
}
