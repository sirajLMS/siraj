"use client";

import {
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import type { QuotaAutocompleteSlot } from "@/frontend/common/components/ui/dialog/types/createRecurringClassDialogShared.types";
import { OnDemandNoCreditsOutcome, SchedulingMode } from "@/frontend/common/graphql/generated/gql/graphql";
import type { CreateRecurringClassDialogFormState } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type { TeacherCreateRecurringClassLabels } from "@/shared/locale";

/** Radio group selecting how classes are scheduled (fixed count, on-demand, quota). */
function SchedulingModeRadioGroup({
  schedulingMode,
  mutationLoading,
  t,
  onSchedulingModeChange,
}: {
  readonly schedulingMode: SchedulingMode | null;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
  readonly onSchedulingModeChange: (value: string) => void;
}) {
  return (
    <FormControl fullWidth disabled={mutationLoading}>
      <Box component="label" sx={{ typography: "body2", mb: 1 }}>
        {t.scheduling.mode}
      </Box>
      <RadioGroup row value={schedulingMode ?? ""} onChange={e => onSchedulingModeChange(e.target.value)}>
        <FormControlLabel
          value={SchedulingMode.NumberOfClasses}
          control={<Radio />}
          label={t.scheduling.modes.NumberOfClasses}
        />
        <FormControlLabel value={SchedulingMode.OnDemand} control={<Radio />} label={t.scheduling.modes.OnDemand} />
        <FormControlLabel value={SchedulingMode.Quota} control={<Radio />} label={t.scheduling.modes.Quota} />
      </RadioGroup>
    </FormControl>
  );
}

/** Quota autocomplete shown only when the quota scheduling mode is active. */
function QuotaSelectionField({
  studentId,
  quotaId,
  onQuotaChange,
  mutationLoading,
  t,
  QuotaAutocomplete,
}: {
  readonly studentId: string;
  readonly quotaId: string | null;
  readonly onQuotaChange: (value: string | null) => void;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
  readonly QuotaAutocomplete: QuotaAutocompleteSlot;
}) {
  return (
    <QuotaAutocomplete
      studentId={studentId}
      value={quotaId}
      onChange={onQuotaChange}
      disabled={mutationLoading}
      label={t.scheduling.quotaSelect}
      placeholder={t.scheduling.quotaPlaceholder}
      noOptionsText={t.scheduling.noOpenQuotas}
      noOptionsCta={t.scheduling.noOpenQuotasCta}
      optionLabel={option => t.scheduling.quotaOptionLabel(option.name, option.remaining, option.validUntil)}
    />
  );
}

/** Integer input shared by the earmarked-classes and generation-horizon fields. */
function SchedulingNumericField({
  label,
  value,
  onChange,
  mutationLoading,
  htmlInput,
}: {
  readonly label: string;
  readonly value: number | null;
  readonly onChange: (value: number | null) => void;
  readonly mutationLoading: boolean;
  readonly htmlInput?: { readonly min: number; readonly max: number };
}) {
  return (
    <TextField
      fullWidth
      label={label}
      type="number"
      slotProps={htmlInput ? { htmlInput } : undefined}
      value={value ?? ""}
      onChange={e => {
        const val = e.target.value;
        onChange(val === "" ? null : Number(val));
      }}
      disabled={mutationLoading}
    />
  );
}

/** Select for the outcome applied when an on-demand class runs out of credits. */
function OnDemandNoCreditsOutcomeSelect({
  value,
  mutationLoading,
  t,
  onChange,
}: {
  readonly value: OnDemandNoCreditsOutcome | null;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
  readonly onChange: (value: string) => void;
}) {
  return (
    <FormControl fullWidth>
      <InputLabel id="ondemand-no-credits-outcome-label" shrink>
        {t.scheduling.ondemandNoCreditsOutcome}
      </InputLabel>
      <Select
        labelId="ondemand-no-credits-outcome-label"
        id="ondemand-no-credits-outcome-select"
        value={value ?? ""}
        label={t.scheduling.ondemandNoCreditsOutcome}
        onChange={e => onChange(e.target.value)}
        disabled={mutationLoading}
        displayEmpty
      >
        <MenuItem value="">
          <em>{t.scheduling.noMode}</em>
        </MenuItem>
        <MenuItem value={OnDemandNoCreditsOutcome.AutoCancel}>{t.scheduling.ondemandNoCredits.AutoCancel}</MenuItem>
        <MenuItem value={OnDemandNoCreditsOutcome.AutoAbsentNoCredits}>
          {t.scheduling.ondemandNoCredits.AutoAbsentNoCredits}
        </MenuItem>
        <MenuItem value={OnDemandNoCreditsOutcome.RemindOnly}>{t.scheduling.ondemandNoCredits.RemindOnly}</MenuItem>
      </Select>
    </FormControl>
  );
}

/** Scheduling controls: mode selection plus the mode-specific quota and outcome fields. */
export function SchedulingFields({
  state,
  mutationLoading,
  t,
  onSchedulingModeChange,
  onOndemandNoCreditsOutcomeChange,
  QuotaAutocomplete,
}: {
  readonly state: CreateRecurringClassDialogFormState;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
  readonly onSchedulingModeChange: (value: string) => void;
  readonly onOndemandNoCreditsOutcomeChange: (value: string) => void;
  readonly QuotaAutocomplete: QuotaAutocompleteSlot;
}) {
  const isQuotaMode = state.schedulingMode === SchedulingMode.Quota;
  const isOnDemandMode = state.schedulingMode === SchedulingMode.OnDemand;
  const showCommonFields = isQuotaMode || isOnDemandMode;

  return (
    <Stack sx={{ gap: 2 }}>
      <SchedulingModeRadioGroup
        schedulingMode={state.schedulingMode}
        mutationLoading={mutationLoading}
        t={t}
        onSchedulingModeChange={onSchedulingModeChange}
      />

      {isQuotaMode && (
        <QuotaSelectionField
          studentId={state.studentId}
          quotaId={state.quotaId}
          onQuotaChange={state.setQuotaId}
          mutationLoading={mutationLoading}
          t={t}
          QuotaAutocomplete={QuotaAutocomplete}
        />
      )}

      {showCommonFields && (
        <SchedulingNumericField
          label={t.scheduling.earmarkedClasses}
          value={state.earmarkedClasses}
          onChange={state.setEarmarkedClasses}
          mutationLoading={mutationLoading}
        />
      )}

      {showCommonFields && (
        <SchedulingNumericField
          label={t.scheduling.generationHorizon}
          htmlInput={{ min: 1, max: 52 }}
          value={state.generationHorizonWeeks}
          onChange={state.setGenerationHorizonWeeks}
          mutationLoading={mutationLoading}
        />
      )}

      {isOnDemandMode && (
        <OnDemandNoCreditsOutcomeSelect
          value={state.ondemandNoCreditsOutcome}
          mutationLoading={mutationLoading}
          t={t}
          onChange={onOndemandNoCreditsOutcomeChange}
        />
      )}
    </Stack>
  );
}
