"use client";

import { Alert, Stack } from "@mui/material";
import { useMemo, useState } from "react";
import { FormDialogShell } from "@/frontend/common/components/ui/dialog";
import { logger } from "@/frontend/common/utils/logger";
import { LessonReportFormFields } from "@/frontend/common/views/dashboard/teachers/dashboard/components/LessonReportSubmitDialog.fields";
import {
  buildInitialLessonReportForm,
  collectLessonReportFieldErrors,
  type LessonReportFormState,
} from "@/frontend/common/views/dashboard/teachers/dashboard/components/LessonReportSubmitDialog.helpers";
import { lessonReportFormSchema } from "@/frontend/common/views/dashboard/teachers/dashboard/schemas/lessonReportFormSchema";
import type {
  LessonReportFormLabels,
  LessonReportFormSubmitInput,
} from "@/frontend/common/views/dashboard/teachers/dashboard/types/lessonReportFormTypes";

interface LessonReportSubmitDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly classInstanceId: string;
  readonly defaultDurationMinutes?: number;
  readonly labels: LessonReportFormLabels;
  readonly onSubmit: (input: LessonReportFormSubmitInput) => Promise<void>;
  /** Renders the dialog edge-to-edge; the mobile tier wrapper sets this. */
  readonly fullScreen?: boolean;
}

export type { LessonReportSubmitDialogProps };

export function LessonReportSubmitDialog({
  open,
  onClose,
  classInstanceId,
  defaultDurationMinutes,
  labels,
  onSubmit,
  fullScreen = false,
}: Readonly<LessonReportSubmitDialogProps>) {
  const [form, setForm] = useState<LessonReportFormState>(() => buildInitialLessonReportForm(defaultDurationMinutes));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(buildInitialLessonReportForm(defaultDurationMinutes));
      setErrors({});
      setError(null);
    }
  }

  const schema = useMemo(() => lessonReportFormSchema(labels), [labels]);

  const handleFieldChange = <K extends keyof LessonReportFormState>(field: K, value: LessonReportFormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleFormSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setErrors(collectLessonReportFieldErrors(parsed.error));
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
    <FormDialogShell
      open={open}
      title={labels.dialogTitle}
      onClose={onClose}
      onSubmit={handleFormSubmit}
      submitting={submitting}
      cancelLabel={labels.cancel}
      submitLabel={labels.submit}
      submittingLabel={labels.submitting}
      fullScreen={fullScreen}
    >
      <Stack spacing={3} sx={{ mt: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <LessonReportFormFields
          form={form}
          errors={errors}
          submitting={submitting}
          labels={labels}
          onFieldChange={handleFieldChange}
        />
      </Stack>
    </FormDialogShell>
  );
}
