"use client";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { type ReactNode, useId } from "react";
import { Controller } from "react-hook-form";
import { DialogPresets } from "@/frontend/common/components/ui/dialog/dialogPresets";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { CalculationStatusChip } from "@/frontend/common/views/dashboard/accounting/payroll/CalculationStatusChip";
import {
  NOTE_MAX_LENGTH,
  useOverrideDialogViewModel,
} from "@/frontend/common/views/dashboard/accounting/payroll/useOverrideDialogViewModel";
import type { PayrollReportRow } from "@/frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel";

/** HTML id of the dialog form so the submit button in DialogActions can target it. */
const FORM_ID = "payroll-override-form";

const SUMMARY_GRID_SX = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
} as const;

export interface OverrideDialogProps {
  /** Whether the dialog is visible; every open starts a fresh form session. */
  readonly open: boolean;
  /** Report row the override targets; null leaves the summary blank and disables submission. */
  readonly row: PayrollReportRow | null;
  /** Close request raised by Cancel, Escape, backdrop click, or a successful override. */
  readonly onClose: () => void;
}

interface SummaryItemProps {
  readonly label: string;
  readonly value: ReactNode;
}

function SummaryItem({ label, value }: Readonly<SummaryItemProps>) {
  return (
    <Stack sx={{ gap: 0.5 }}>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
        {label}
      </Typography>
      <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Stack>
  );
}

function formatPaidAmount(amount: string | null, currency: CurrencyCode | null): string {
  if (amount === null) return "—";
  return currency === null ? amount : `${amount} ${currency}`;
}

export function OverrideDialog({ open, row, onClose }: Readonly<OverrideDialogProps>) {
  const viewModel = useOverrideDialogViewModel({ open, row, onClose });
  const { form, labels, commonLabels } = viewModel;
  const targetGroupLabelId = useId();
  const forceAlertId = useId();

  return (
    <Dialog {...DialogPresets.info} open={open} onClose={viewModel.submitting ? undefined : viewModel.onCancel}>
      <DialogTitle sx={{ fontWeight: 700 }}>{labels.override.title}</DialogTitle>
      <DialogContent>
        <Stack
          id={FORM_ID}
          component="form"
          // Native constraint validation (required/min/max/step) would swallow
          // the submit event with browser bubbles whenever a constraint fails,
          // so the Zod resolver never runs. Validation mirrors the server rules
          // and surfaces as inline field errors instead.
          noValidate
          sx={{ gap: 3, pt: 1 }}
          onSubmit={event => {
            event.preventDefault();
            viewModel.onSubmit();
          }}
        >
          {viewModel.alreadyPaidBlocked ? <Alert severity="error">{labels.error.alreadyPaid}</Alert> : null}

          <Box sx={theme => ({ backgroundColor: theme.palette.surfaceContainer, borderRadius: 2, p: 2.5 })}>
            <Box sx={SUMMARY_GRID_SX}>
              <SummaryItem
                label={labels.override.currentStatus}
                value={
                  viewModel.summary.calculationStatus === null ? (
                    "—"
                  ) : (
                    <CalculationStatusChip
                      status={viewModel.summary.calculationStatus}
                      labels={viewModel.statusLabels}
                    />
                  )
                }
              />
              <SummaryItem
                label={labels.column.paidAmount}
                value={formatPaidAmount(viewModel.summary.teacherPaidAmount, viewModel.summary.teacherPaidCurrency)}
              />
              <SummaryItem
                label={labels.column.calculatedDuration}
                value={viewModel.summary.calculatedDuration ?? "—"}
              />
              <SummaryItem
                label={labels.column.partialPercentage}
                value={viewModel.summary.isPartialPercentage ?? "—"}
              />
              <SummaryItem label={labels.column.note} value={viewModel.summary.payrollNote ?? "—"} />
            </Box>
          </Box>

          <FormControl disabled={viewModel.submitting}>
            <FormLabel id={targetGroupLabelId}>{labels.column.status}</FormLabel>
            <Controller
              name="targetStatus"
              control={form.control}
              render={({ field }) => (
                <RadioGroup
                  aria-labelledby={targetGroupLabelId}
                  value={field.value}
                  onChange={event => viewModel.onTargetStatusChange(event.target.value)}
                >
                  {viewModel.targetOptions.map(option => (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      control={<Radio />}
                      label={option.label}
                      disabled={viewModel.submitting}
                    />
                  ))}
                </RadioGroup>
              )}
            />
          </FormControl>

          {viewModel.isPartialTarget ? (
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
                  disabled={viewModel.submitting}
                  error={fieldState.error !== undefined}
                  helperText={fieldState.error?.message}
                  aria-invalid={fieldState.error !== undefined}
                  slotProps={{ htmlInput: { min: 0, max: 100, step: 1 } }}
                />
              )}
            />
          ) : null}

          <Controller
            name="note"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                multiline
                minRows={2}
                label={labels.override.note}
                required={viewModel.noteRequired}
                fullWidth
                disabled={viewModel.submitting}
                error={fieldState.error !== undefined}
                helperText={fieldState.error?.message}
                aria-invalid={fieldState.error !== undefined}
                slotProps={{ htmlInput: { maxLength: NOTE_MAX_LENGTH } }}
              />
            )}
          />

          {viewModel.showForceCheckbox ? (
            <Controller
              name="force"
              control={form.control}
              render={({ field }) => (
                <FormControlLabel
                  sx={
                    viewModel.forceHighlighted
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
                      onChange={event => viewModel.onForceChange(event.target.checked)}
                      disabled={viewModel.submitting}
                      slotProps={{
                        input: { "aria-describedby": viewModel.forceHighlighted ? forceAlertId : undefined },
                      }}
                    />
                  }
                  label={labels.override.force}
                />
              )}
            />
          ) : null}

          {viewModel.forceHighlighted ? (
            <Alert severity="warning" id={forceAlertId}>
              {labels.error.awaitingSettlement}
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          variant="text"
          onClick={viewModel.onCancel}
          disabled={viewModel.submitting}
          sx={theme => ({ color: theme.palette.text.secondary, fontWeight: 700, borderRadius: 1.5 })}
        >
          {commonLabels.cancel}
        </Button>
        <Button
          type="submit"
          form={FORM_ID}
          variant="contained"
          disabled={viewModel.submitting || !viewModel.canSubmit}
          aria-busy={viewModel.submitting}
          sx={theme => ({
            backgroundColor: theme.palette.error.main,
            color: theme.palette.onError,
            fontWeight: 700,
            borderRadius: 1.5,
            "&:hover": { backgroundColor: theme.palette.error.dark },
          })}
        >
          {viewModel.submitting ? (
            <CircularProgress size={20} sx={theme => ({ color: theme.palette.onError })} />
          ) : (
            labels.override.action
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
