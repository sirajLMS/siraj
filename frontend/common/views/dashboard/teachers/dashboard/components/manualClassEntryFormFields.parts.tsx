"use client";

import { Alert, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from "@mui/material";
import type { ReactNode } from "react";
import { AppDatePicker } from "@/frontend/common/components/ui/form/date";
import { AppTimePicker } from "@/frontend/common/components/ui/form/time";
import { SubjectSelect } from "@/frontend/common/views/dashboard/classes/recurring/components/SubjectSelectField";
import type { ClassSubjectOption } from "@/frontend/common/views/dashboard/classes/recurring/types";
import {
  formatDateValue,
  formatTimeValue,
  type ManualClassEntryLabels,
  parseDateValue,
  parseTimeValue,
} from "@/frontend/common/views/dashboard/teachers/dashboard/components/manualClassEntryDialog.helpers";

interface ManualClassEntryFormFieldsProps {
  readonly error: string | null;
  readonly studentSelect: ReactNode;
  readonly subjectId: string;
  readonly setSubjectId: (value: string) => void;
  readonly subjects: readonly ClassSubjectOption[];
  readonly subjectsLoading: boolean;
  readonly date: string;
  readonly setDate: (value: string) => void;
  readonly startTime: string;
  readonly setStartTime: (value: string) => void;
  readonly duration: number;
  readonly setDuration: (value: number) => void;
  readonly classType: string;
  readonly setClassType: (value: string) => void;
  readonly submitting: boolean;
  readonly labels: ManualClassEntryLabels;
}

export function ManualClassEntryFormFields({
  error,
  studentSelect,
  subjectId,
  setSubjectId,
  subjects,
  subjectsLoading,
  date,
  setDate,
  startTime,
  setStartTime,
  duration,
  setDuration,
  classType,
  setClassType,
  submitting,
  labels,
}: Readonly<ManualClassEntryFormFieldsProps>) {
  return (
    <Stack spacing={3} sx={{ mt: 1 }}>
      {error && <Alert severity="error">{error}</Alert>}

      {studentSelect}

      <SubjectSelect
        value={subjectId}
        onChange={setSubjectId}
        label={labels.subjectLabel}
        placeholder={labels.subjectPlaceholder}
        subjects={subjects}
        loading={subjectsLoading}
        disabled={submitting}
      />

      <AppDatePicker
        label={labels.scheduledDate}
        value={parseDateValue(date)}
        disabled={submitting}
        onChange={(value: Date | null) => setDate(formatDateValue(value))}
        slotProps={{
          textField: {
            required: true,
            fullWidth: true,
            slotProps: { htmlInput: { autoComplete: "off" } },
          },
        }}
      />

      <AppTimePicker
        label={labels.startTime}
        value={parseTimeValue(startTime)}
        disabled={submitting}
        onChange={(value: Date | null) => setStartTime(formatTimeValue(value))}
        slotProps={{
          textField: {
            required: true,
            fullWidth: true,
            slotProps: { htmlInput: { autoComplete: "off" } },
          },
        }}
      />

      <TextField
        label={labels.durationMinutes}
        type="number"
        required
        fullWidth
        value={duration}
        onChange={e => setDuration(Number(e.target.value))}
        slotProps={{
          htmlInput: { min: 15, step: 15 },
        }}
      />

      <FormControl fullWidth required>
        <InputLabel id="class-type-select-label" shrink>
          {labels.classType}
        </InputLabel>
        <Select
          labelId="class-type-select-label"
          value={classType}
          label={labels.classType}
          onChange={e => setClassType(e.target.value)}
        >
          <MenuItem value="REGULAR">{labels.classTypeRegular}</MenuItem>
          <MenuItem value="TRIAL">{labels.classTypeTrial}</MenuItem>
          <MenuItem value="PROMOTION">{labels.classTypePromotion}</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
}
