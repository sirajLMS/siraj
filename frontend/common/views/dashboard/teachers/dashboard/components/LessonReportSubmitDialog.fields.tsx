"use client";

import {
  Box,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  TextField,
  Typography,
} from "@mui/material";
import { ATTENDANCE_OPTIONS } from "@/frontend/common/views/dashboard/teachers/dashboard/components/LessonReportSubmitDialog.constants";
import type { LessonReportFormState } from "@/frontend/common/views/dashboard/teachers/dashboard/components/LessonReportSubmitDialog.helpers";
import type { LessonReportFormLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/lessonReportFormTypes";

export interface LessonReportFormFieldsProps {
  readonly form: LessonReportFormState;
  readonly errors: Record<string, string>;
  readonly submitting: boolean;
  readonly labels: LessonReportFormLabels;
  readonly onFieldChange: <K extends keyof LessonReportFormState>(field: K, value: LessonReportFormState[K]) => void;
}

export function LessonReportFormFields({
  form,
  errors,
  submitting,
  labels,
  onFieldChange,
}: Readonly<LessonReportFormFieldsProps>) {
  return (
    <>
      <FormControl fullWidth required error={Boolean(errors.attendanceEvaluation)}>
        <InputLabel id="attendance-evaluation-label">{labels.attendanceEvaluation}</InputLabel>
        <Select
          labelId="attendance-evaluation-label"
          value={form.attendanceEvaluation}
          label={labels.attendanceEvaluation}
          disabled={submitting}
          onChange={e => {
            onFieldChange("attendanceEvaluation", e.target.value);
          }}
        >
          {ATTENDANCE_OPTIONS.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {labels[option.labelKey]}
            </MenuItem>
          ))}
        </Select>
        {errors.attendanceEvaluation && <FormHelperText>{errors.attendanceEvaluation}</FormHelperText>}
      </FormControl>

      <TextField
        label={labels.durationMinutes}
        type="number"
        required
        fullWidth
        value={form.durationMinutes}
        disabled={submitting}
        error={Boolean(errors.durationMinutes)}
        helperText={errors.durationMinutes}
        onChange={e => {
          onFieldChange("durationMinutes", Number(e.target.value));
        }}
        slotProps={{ htmlInput: { min: 1, max: 600, step: 1 } }}
      />

      <Box>
        <Typography variant="bodyMd" sx={{ mb: 1 }}>
          {labels.completionPercentage}: {form.completionPercentage}%
        </Typography>
        <Slider
          value={form.completionPercentage}
          min={0}
          max={100}
          step={1}
          disabled={submitting}
          onChange={(_, value) => {
            onFieldChange("completionPercentage", Array.isArray(value) ? value[0] : value);
          }}
          valueLabelDisplay="auto"
        />
        {errors.completionPercentage && <FormHelperText error>{errors.completionPercentage}</FormHelperText>}
      </Box>

      <TextField
        label={labels.teacherNotes}
        multiline
        rows={4}
        fullWidth
        value={form.teacherNotes}
        disabled={submitting}
        error={Boolean(errors.teacherNotes)}
        helperText={errors.teacherNotes}
        onChange={e => {
          onFieldChange("teacherNotes", e.target.value);
        }}
      />
    </>
  );
}
