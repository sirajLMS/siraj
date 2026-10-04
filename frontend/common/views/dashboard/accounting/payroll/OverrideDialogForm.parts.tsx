"use client";

import { Alert, Checkbox, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from "@mui/material";
import { useId } from "react";
import { Controller } from "react-hook-form";
import {
  NOTE_MAX_LENGTH,
  type OverrideDialogViewModel,
} from "@/frontend/common/views/dashboard/accounting/payroll/useOverrideDialogViewModel";

interface OverrideFormFieldProps {
  readonly viewModel: OverrideDialogViewModel;
}

/** Target status radio group; terminal Paid/Waiting Paid states are not offered. */
export function OverrideTargetStatusField({ viewModel }: Readonly<OverrideFormFieldProps>) {
  const { form, labels, submitting, targetOptions, onTargetStatusChange } = viewModel;
  const targetGroupLabelId = useId();

  return (
    <FormControl disabled={submitting}>
      <FormLabel id={targetGroupLabelId}>{labels.column.status}</FormLabel>
      <Controller
        name="targetStatus"
        control={form.control}
        render={({ field }) => (
          <RadioGroup
            aria-labelledby={targetGroupLabelId}
            value={field.value}
            onChange={event => onTargetStatusChange(event.target.value)}
          >
            {targetOptions.map(option => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.label}
                disabled={submitting}
              />
            ))}
          </RadioGroup>
        )}
      />
    </FormControl>
  );
}

/** Percentage input, rendered only while the Partially target is selected. */
export function OverridePercentageField({ viewModel }: Readonly<OverrideFormFieldProps>) {
  const { form, labels, submitting, isPartialTarget } = viewModel;
  if (!isPartialTarget) return null;

  return (
    <Controller
      name="partialPercentage"
      control={form.control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          type="number"
          label={labels.override.percentage}
          required
          fullWidth
          disabled={submitting}
          error={fieldState.error !== undefined}
          helperText={fieldState.error?.message}
          aria-invalid={fieldState.error !== undefined}
          slotProps={{ htmlInput: { min: 0, max: 100, step: 1 } }}
        />
      )}
    />
  );
}

/** Operator note; the character cap mirrors the server-side limit. */
export function OverrideNoteField({ viewModel }: Readonly<OverrideFormFieldProps>) {
  const { form, labels, submitting, noteRequired } = viewModel;

  return (
    <Controller
      name="note"
      control={form.control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          multiline
          minRows={2}
          label={labels.override.note}
          required={noteRequired}
          fullWidth
          disabled={submitting}
          error={fieldState.error !== undefined}
          helperText={fieldState.error?.message ?? labels.override.noteHint}
          aria-invalid={fieldState.error !== undefined}
          slotProps={{ htmlInput: { maxLength: NOTE_MAX_LENGTH } }}
        />
      )}
    />
  );
}

/** Force checkbox plus its awaiting-settlement banner; hidden unless force can matter. */
export function OverrideForceField({ viewModel }: Readonly<OverrideFormFieldProps>) {
  const { form, labels, submitting, forceHighlighted, showForceCheckbox, onForceChange } = viewModel;
  const forceAlertId = useId();
  if (!showForceCheckbox) return null;

  return (
    <>
      <Controller
        name="force"
        control={form.control}
        render={({ field }) => (
          <FormControlLabel
            sx={
              forceHighlighted
                ? theme => ({
                    color: theme.palette.error.main,
                    border: "1px solid",
                    borderColor: theme.palette.error.main,
                    borderRadius: 1,
                    px: 1,
                    py: 0.5,
                  })
                : undefined
            }
            control={
              <Checkbox
                checked={field.value}
                onChange={event => onForceChange(event.target.checked)}
                disabled={submitting}
                slotProps={{
                  input: { "aria-describedby": forceHighlighted ? forceAlertId : undefined },
                }}
              />
            }
            label={labels.override.force}
          />
        )}
      />
      {forceHighlighted ? (
        <Alert severity="warning" id={forceAlertId}>
          {labels.error.awaitingSettlement}
        </Alert>
      ) : null}
    </>
  );
}
