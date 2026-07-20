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
import { type ReactNode, useEffect, useState } from "react";
import { logger } from "@/frontend/common/utils/logger";
import { SubjectSelect } from "@/frontend/common/views/dashboard/classes/recurring/components/SubjectSelectField";
import { ManualClassEntryStudentFieldContext } from "@/frontend/common/views/dashboard/teachers/dashboard/components/manualClassEntryStudentFieldContext";
import type { TeacherDashboardLabels } from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale";

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
}

export function ManualClassEntryDialog({
  open,
  onClose,
  onSubmit,
  defaultActive = false,
  studentSelect,
}: Readonly<ManualClassEntryDialogProps>) {
  const t = useAppTranslation().dashboardTranslations.teacherDashboard;
  const [studentId, setStudentId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [classType, setClassType] = useState("REGULAR");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setStudentId("");
      setSubjectId("");
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      setDate(`${yyyy}-${mm}-${dd}`);

      if (defaultActive) {
        const hh = String(now.getHours()).padStart(2, "0");
        const min = String(now.getMinutes()).padStart(2, "0");
        setStartTime(`${hh}:${min}`);
      } else {
        const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
        const hh = String(nextHour.getHours()).padStart(2, "0");
        setStartTime(`${hh}:00`);
      }
      setDuration(60);
      setClassType("REGULAR");
    }
  }, [open, defaultActive]);

  const handleFormSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!studentId) {
      setError(t.manualClassEntry.selectStudent);
      return;
    }
    if (!subjectId) {
      setError(t.manualClassEntry.selectSubject);
      return;
    }
    if (!date) {
      setError(t.manualClassEntry.selectDate);
      return;
    }
    if (!startTime) {
      setError(t.manualClassEntry.selectTime);
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
      setError(t.manualClassEntry.createFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleFormSubmit}>
        <DialogTitle sx={{ typography: "titleLg" }}>
          {defaultActive ? t.manualClassEntry.titleCreateActive : t.manualClassEntry.titleCreate}
        </DialogTitle>
        <DialogContent dividers>
          <ManualClassEntryStudentFieldContext.Provider value={{ studentId, setStudentId, disabled: submitting }}>
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
              t={t}
            />
          </ManualClassEntryStudentFieldContext.Provider>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={submitting}>
            {t.manualClassEntry.cancel}
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? t.manualClassEntry.creating : t.manualClassEntry.create}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
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
  readonly t: TeacherDashboardLabels;
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
  t,
}: Readonly<ManualClassEntryFormFieldsProps>) {
  return (
    <Stack spacing={3} sx={{ mt: 1 }}>
      {error && <Alert severity="error">{error}</Alert>}

      {studentSelect}

      <SubjectSelect
        value={subjectId}
        onChange={setSubjectId}
        label={t.manualClassEntry.subjectLabel}
        placeholder={t.manualClassEntry.subjectPlaceholder}
        disabled={submitting}
      />

      <TextField
        label={t.manualClassEntry.scheduledDate}
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
        label={t.manualClassEntry.startTime}
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
        label={t.manualClassEntry.durationMinutes}
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
          {t.manualClassEntry.classType}
        </InputLabel>
        <Select
          labelId="class-type-select-label"
          value={classType}
          label={t.manualClassEntry.classType}
          onChange={e => setClassType(e.target.value)}
        >
          <MenuItem value="REGULAR">{t.manualClassEntry.classTypeRegular}</MenuItem>
          <MenuItem value="TRIAL">{t.manualClassEntry.classTypeTrial}</MenuItem>
          <MenuItem value="PROMOTION">{t.manualClassEntry.classTypePromotion}</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
}
