"use client";

import { Alert, Box, Chip, Stack, TextField, Typography } from "@mui/material";
import type { ChangeEvent } from "react";
import { FilterButton, PrimaryPageAction } from "@/frontend/common/components/ui/button";
import { RichTextEditor } from "@/frontend/common/components/ui/input";
import { AdjustmentTypeRadioGroup } from "@/frontend/common/views/dashboard/accounting/credits/AdjustmentTypeRadioGroup";
import {
  CarryoverBanner,
  type CarryoverBannerErrors,
} from "@/frontend/common/views/dashboard/accounting/credits/CarryoverBanner";
import { INTERNAL_NOTES_MAX_LENGTH } from "@/frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.helpers";
import type {
  CreditAdjustDraft,
  CreditAdjustFormBodyLabels,
  SubmitError,
} from "@/frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.types";

interface CreditAdjustDetailsSectionProps {
  readonly adjustmentTypeTitle: string;
  readonly isCarryover: boolean;
  readonly carryoverErrors: CarryoverBannerErrors | undefined;
  readonly draft: CreditAdjustDraft;
  readonly hoursError: string | undefined;
  readonly notesError: string | undefined;
  readonly submitting: boolean;
  readonly summaryText: string | null;
  readonly onHoursChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onNotesChange: (html: string) => void;
  readonly onInternalNotesChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  readonly labels: CreditAdjustFormBodyLabels;
}

export function CreditAdjustDetailsSection({
  adjustmentTypeTitle,
  isCarryover,
  carryoverErrors,
  draft,
  hoursError,
  notesError,
  submitting,
  summaryText,
  onHoursChange,
  onNotesChange,
  onInternalNotesChange,
  labels,
}: CreditAdjustDetailsSectionProps) {
  return (
    <>
      <AdjustmentTypeRadioGroup sectionTitle={adjustmentTypeTitle} />
      {isCarryover ? <CarryoverBanner errors={carryoverErrors} /> : null}
      <TextField
        type="number"
        label={labels.t.hours.label}
        value={draft.hours ?? ""}
        onChange={onHoursChange}
        error={hoursError !== undefined}
        helperText={hoursError}
        disabled={submitting}
        required
        aria-invalid={hoursError !== undefined}
        // Numeric input needs no full-width stretch; keep it compact with
        // the same outlined floating-label convention as the other fields.
        sx={{ width: "100%", maxWidth: 240 }}
        slotProps={{ htmlInput: { min: 1, step: 1 } }}
      />
      <Box
        sx={theme => ({
          // The shared editor fixes a taller body than this short-form
          // reason warrants (~3 rows here); a wrapper-level override keeps
          // the shared component untouched.
          "& .ProseMirror.ProseMirror": { minHeight: theme.spacing(9) },
        })}
      >
        <RichTextEditor
          value={draft.notes}
          onChange={onNotesChange}
          label={labels.t.reason.label}
          error={notesError !== undefined}
          helperText={notesError}
          disabled={submitting}
          required
        />
      </Box>
      <TextField
        multiline
        minRows={2}
        label={labels.t.form.internalNotes}
        helperText={labels.t.form.internalNotesHint}
        value={draft.internalNotes}
        onChange={onInternalNotesChange}
        disabled={submitting}
        fullWidth
        slotProps={{ htmlInput: { maxLength: INTERNAL_NOTES_MAX_LENGTH } }}
      />
      {summaryText !== null ? (
        // Pre-submit recap of the pending write, re-derived from the store
        // on every render so it always matches the current draft.
        <Alert severity="info">{summaryText}</Alert>
      ) : null}
    </>
  );
}

interface CreditAdjustSubmitErrorProps {
  readonly submitError: SubmitError;
}

function CreditAdjustSubmitError({ submitError }: CreditAdjustSubmitErrorProps) {
  return (
    // Authoritative rejection surface: the GraphQL error code next to
    // the server's localized message.
    <Alert severity="error">
      <Stack direction="row" sx={{ alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        {submitError.code !== undefined ? <Chip size="small" label={submitError.code} /> : null}
        <Typography sx={{ fontSize: 14 }}>{submitError.message}</Typography>
      </Stack>
    </Alert>
  );
}

interface CreditAdjustFormFooterProps {
  readonly submitError: SubmitError | null;
  readonly submitting: boolean;
  readonly onCancel: () => void;
  readonly onSubmit: () => void;
  readonly labels: CreditAdjustFormBodyLabels;
}

export function CreditAdjustFormFooter({
  submitError,
  submitting,
  onCancel,
  onSubmit,
  labels,
}: CreditAdjustFormFooterProps) {
  return (
    <>
      {submitError !== null ? <CreditAdjustSubmitError submitError={submitError} /> : null}
      <Stack direction="row" sx={{ justifyContent: "flex-end", gap: 2 }}>
        <FilterButton
          onClick={onCancel}
          disabled={submitting}
          sx={theme => ({
            borderColor: theme.palette.outline,
            color: theme.palette.text.secondary,
            "&:hover": {
              backgroundColor: theme.palette.action.hover,
              borderColor: theme.palette.outline,
            },
          })}
        >
          {labels.common.cancel}
        </FilterButton>
        <PrimaryPageAction onClick={onSubmit} loading={submitting}>
          {labels.t.adjustCredits}
        </PrimaryPageAction>
      </Stack>
    </>
  );
}
