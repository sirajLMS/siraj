"use client";

import { Button, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { type ReactNode, useMemo, useState } from "react";
import { logger } from "@/frontend/common/utils/logger";
import type { ClassSubjectOption } from "@/frontend/common/views/dashboard/classes/recurring/types";
import {
  getInitialDate,
  getInitialStartTime,
  MANUAL_CLASS_ENTRY_TITLE_ID,
  type ManualClassEntryLabels,
  type ManualClassEntrySubmitData,
} from "@/frontend/common/views/dashboard/teachers/dashboard/components/manualClassEntryDialog.helpers";
import { ManualClassEntryFormFields } from "@/frontend/common/views/dashboard/teachers/dashboard/components/manualClassEntryFormFields.parts";
import { ManualClassEntryStudentFieldContext } from "@/frontend/common/views/dashboard/teachers/dashboard/components/manualClassEntryStudentFieldContext";

interface ManualClassEntryFormProps {
  readonly onClose: () => void;
  readonly onSubmit: (data: ManualClassEntrySubmitData) => Promise<void>;
  readonly defaultActive: boolean;
  readonly studentSelect: ReactNode;
  readonly subjects: readonly ClassSubjectOption[];
  readonly subjectsLoading: boolean;
  readonly labels: ManualClassEntryLabels;
}

export function ManualClassEntryForm({
  onClose,
  onSubmit,
  defaultActive,
  studentSelect,
  subjects,
  subjectsLoading,
  labels,
}: Readonly<ManualClassEntryFormProps>) {
  const [studentId, setStudentId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState(getInitialDate);
  const [startTime, setStartTime] = useState(() => getInitialStartTime(defaultActive));
  const [duration, setDuration] = useState(60);
  const [classType, setClassType] = useState("REGULAR");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const studentFieldContext = useMemo(
    () => ({ studentId, setStudentId, disabled: submitting }),
    [studentId, submitting]
  );

  const handleFormSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const missingFieldError = getMissingFieldError({ studentId, subjectId, date, startTime, labels });
    if (missingFieldError) {
      setError(missingFieldError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

      await onSubmit({
        studentId,
        subjectId,
        scheduledStartAt: startDateTime.toISOString(),
        scheduledEndAt: endDateTime.toISOString(),
        durationMinutes: duration,
        classType,
      });
      onClose();
    } catch (err) {
      logger.error("Manual class entry creation failed:", { err });
      setError(labels.createFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <DialogTitle id={MANUAL_CLASS_ENTRY_TITLE_ID} sx={{ typography: "titleLg" }}>
        {defaultActive ? labels.titleCreateActive : labels.titleCreate}
      </DialogTitle>
      <DialogContent dividers>
        <ManualClassEntryStudentFieldContext.Provider value={studentFieldContext}>
          <ManualClassEntryFormFields
            error={error}
            studentSelect={studentSelect}
            subjectId={subjectId}
            setSubjectId={setSubjectId}
            subjects={subjects}
            subjectsLoading={subjectsLoading}
            date={date}
            setDate={setDate}
            startTime={startTime}
            setStartTime={setStartTime}
            duration={duration}
            setDuration={setDuration}
            classType={classType}
            setClassType={setClassType}
            submitting={submitting}
            labels={labels}
          />
        </ManualClassEntryStudentFieldContext.Provider>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          {labels.cancel}
        </Button>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? labels.creating : labels.create}
        </Button>
      </DialogActions>
    </form>
  );
}

interface MissingFieldErrorInput {
  readonly studentId: string;
  readonly subjectId: string;
  readonly date: string;
  readonly startTime: string;
  readonly labels: ManualClassEntryLabels;
}

function getMissingFieldError({
  studentId,
  subjectId,
  date,
  startTime,
  labels,
}: MissingFieldErrorInput): string | null {
  if (!studentId) return labels.selectStudent;
  if (!subjectId) return labels.selectSubject;
  if (!date) return labels.selectDate;
  if (!startTime) return labels.selectTime;
  return null;
}
