"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { AttendanceEvaluation } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { logger } from "@/frontend/common/utils/logger";
import { lessonReportFormSchema } from "@/frontend/common/views/dashboard/teachers/dashboard/schemas/lessonReportFormSchema";
import type {
  AttendanceEvaluationValue,
  LessonReportFormLabels,
  LessonReportFormSubmitInput,
} from "@/frontend/common/views/dashboard/teachers/dashboard/types/lessonReportFormTypes";

const ATTENDANCE_OPTIONS: ReadonlyArray<{
  readonly value: AttendanceEvaluationValue;
  readonly labelKey: "present" | "absent" | "late";
}> = [
  { value: AttendanceEvaluation.Present, labelKey: "present" },
  { value: AttendanceEvaluation.Absent, labelKey: "absent" },
  { value: AttendanceEvaluation.Late, labelKey: "late" },
];

interface LessonReportSubmitDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly classInstanceId: string;
  readonly defaultDurationMinutes?: number;
  readonly labels: LessonReportFormLabels;
  readonly onSubmit: (input: LessonReportFormSubmitInput) => Promise<void>;
}

function buildInitialForm(defaultDurationMinutes?: number) {
  return {
    attendanceEvaluation: AttendanceEvaluation.Present as AttendanceEvaluationValue,
    durationMinutes: defaultDurationMinutes ?? 60,
    completionPercentage: 100,
    teacherNotes: "",
  };
}

export function LessonReportSubmitDialog({
  open,
  onClose,
  classInstanceId,
  defaultDurationMinutes,
  labels,
  onSubmit,
}: Readonly<LessonReportSubmitDialogProps>) {
  const [form, setForm] = useState(() => buildInitialForm(defaultDurationMinutes));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(buildInitialForm(defaultDurationMinutes));
      setErrors({});
      setError(null);
    }
  }

  const schema = useMemo(() => lessonReportFormSchema(labels), [labels]);

  const handleFormSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        classInstanceId,
        attendanceEvaluation: parsed.data.attendanceEvaluation,
        durationMinutes: parsed.data.durationMinutes,
        completionPercentage: parsed.data.completionPercentage,
        teacherNotes: parsed.data.teacherNotes ?? null,
      });
      onClose();
    } catch (err) {
      logger.error("Lesson report submission failed:", { err });
      setError(labels.submitFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleFormSubmit}>
        <DialogTitle sx={{ typography: "titleLg" }}>{labels.dialogTitle}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <FormControl fullWidth required error={Boolean(errors.attendanceEvaluation)}>
              <InputLabel id="attendance-evaluation-label">{labels.attendanceEvaluation}</InputLabel>
              <Select
                labelId="attendance-evaluation-label"
                value={form.attendanceEvaluation}
                label={labels.attendanceEvaluation}
                disabled={submitting}
                onChange={e => {
                  setForm(prev => ({ ...prev, attendanceEvaluation: e.target.value }));
                  setErrors(prev => ({ ...prev, attendanceEvaluation: "" }));
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
                setForm(prev => ({ ...prev, durationMinutes: Number(e.target.value) }));
                setErrors(prev => ({ ...prev, durationMinutes: "" }));
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
                  setForm(prev => ({ ...prev, completionPercentage: Array.isArray(value) ? value[0] : value }));
                  setErrors(prev => ({ ...prev, completionPercentage: "" }));
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
                setForm(prev => ({ ...prev, teacherNotes: e.target.value }));
                setErrors(prev => ({ ...prev, teacherNotes: "" }));
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={onClose} disabled={submitting}>
            {labels.cancel}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {submitting ? labels.submitting : labels.submit}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
