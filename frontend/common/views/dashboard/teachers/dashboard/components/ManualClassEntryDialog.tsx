"use client";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { type ReactNode, useMemo, useState } from "react";
import { logger } from "@/frontend/common/utils/logger";
import { SubjectSelect } from "@/frontend/common/views/dashboard/classes/recurring/components/SubjectSelectField";
import { ManualClassEntryStudentFieldContext } from "@/frontend/common/views/dashboard/teachers/dashboard/components/manualClassEntryStudentFieldContext";
import type { TeacherDashboardLabels } from "@/shared/locale";

type ManualClassEntryLabels = TeacherDashboardLabels["manualClassEntry"];

interface ManualClassEntryDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (data: {
    studentId: string;
    subjectId: string;
    scheduledStartAt: string;
    scheduledEndAt: string;
    durationMinutes: number;
    classType: string;
  }) => Promise<void>;
  readonly defaultActive?: boolean;
  readonly studentSelect: ReactNode;
  readonly labels: ManualClassEntryLabels;
}

export function ManualClassEntryDialog({
  open,
  onClose,
  onSubmit,
  defaultActive = false,
  studentSelect,
  labels,
}: Readonly<ManualClassEntryDialogProps>) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <ManualClassEntryForm
        key={open ? "open" : "closed"}
        onClose={onClose}
        onSubmit={onSubmit}
        defaultActive={defaultActive}
        studentSelect={studentSelect}
        labels={labels}
      />
    </Dialog>
  );
}

interface ManualClassEntryFormProps {
  readonly onClose: () => void;
  readonly onSubmit: (data: {
    studentId: string;
    subjectId: string;
    scheduledStartAt: string;
    scheduledEndAt: string;
    durationMinutes: number;
    classType: string;
  }) => Promise<void>;
  readonly defaultActive: boolean;
  readonly studentSelect: ReactNode;
  readonly labels: ManualClassEntryLabels;
}

function getInitialDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getInitialStartTime(defaultActive: boolean): string {
  const now = new Date();
  if (defaultActive) {
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    return `${hh}:${min}`;
  }
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
  const hh = String(nextHour.getHours()).padStart(2, "0");
  return `${hh}:00`;
}

function ManualClassEntryForm({
  onClose,
  onSubmit,
  defaultActive,
  studentSelect,
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

  const handleFormSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!studentId) {
      setError(labels.selectStudent);
      return;
    }
    if (!subjectId) {
      setError(labels.selectSubject);
      return;
    }
    if (!date) {
      setError(labels.selectDate);
      return;
    }
    if (!startTime) {
      setError(labels.selectTime);
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
      <DialogTitle sx={{ typography: "titleLg" }}>
        {defaultActive ? labels.titleCreateActive : labels.titleCreate}
      </DialogTitle>
      <DialogContent dividers>
        <ManualClassEntryStudentFieldContext.Provider
          value={useMemo(() => ({ studentId, setStudentId, disabled: submitting }), [studentId, submitting])}
        >
          <ManualClassEntryFormFields
            error={error}
            studentSelect={studentSelect}
            subjectId={subjectId}
            setSubjectId={setSubjectId}
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

interface ManualClassEntryFormFieldsProps {
  readonly error: string | null;
  readonly studentSelect: ReactNode;
  readonly subjectId: string;
  readonly setSubjectId: (value: string) => void;
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

function ManualClassEntryFormFields({
  error,
  studentSelect,
  subjectId,
  setSubjectId,
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
        disabled={submitting}
      />

      <TextField
        label={labels.scheduledDate}
        type="date"
        required
        fullWidth
        value={date}
        onChange={e => setDate(e.target.value)}
        slotProps={{
          inputLabel: { shrink: true },
        }}
      />

      <TextField
        label={labels.startTime}
        type="time"
        required
        fullWidth
        value={startTime}
        onChange={e => setStartTime(e.target.value)}
        slotProps={{
          inputLabel: { shrink: true },
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
