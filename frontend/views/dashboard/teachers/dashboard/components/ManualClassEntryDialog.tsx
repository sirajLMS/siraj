"use client";

import { useQuery } from "@apollo/client/react";
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
import { useEffect, useState } from "react";
import type { PaginationArgs, StudentFilterArgs } from "@/frontend/graphql/generated/gql/graphql-types";
import { studentsQueryDocument } from "@/frontend/graphql/sharedDocuments/student.documents";

interface ManualClassEntryDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly teacherId: string;
  readonly onSubmit: (data: {
    studentId: string;
    scheduledStartAt: string;
    scheduledEndAt: string;
    durationMinutes: number;
    classType: string;
  }) => Promise<void>;
  readonly defaultActive?: boolean;
}

export function ManualClassEntryDialog({
  open,
  onClose,
  teacherId,
  onSubmit,
  defaultActive = false,
}: Readonly<ManualClassEntryDialogProps>) {
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [classType, setClassType] = useState("REGULAR");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, loading } = useQuery(studentsQueryDocument, {
    variables: {
      filterArgs: (teacherId ? { primaryTeacherId: teacherId } : null) as StudentFilterArgs | null,
      paginationArgs: { page: 0 } as PaginationArgs | null,
      orderBy: null,
    },
    skip: !open || !teacherId,
  });

  // Set default active values when opened
  useEffect(() => {
    if (open) {
      setError(null);
      setStudentId("");
      const now = new Date();
      // Format YYYY-MM-DD
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      setDate(`${yyyy}-${mm}-${dd}`);

      if (defaultActive) {
        // Active mode default is "now"
        const hh = String(now.getHours()).padStart(2, "0");
        const min = String(now.getMinutes()).padStart(2, "0");
        setStartTime(`${hh}:${min}`);
      } else {
        // Standard default is next hour
        const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
        const hh = String(nextHour.getHours()).padStart(2, "0");
        setStartTime(`${hh}:00`);
      }
      setDuration(60);
      setClassType("REGULAR");
    }
  }, [open, defaultActive]);

  const studentsList = data?.students?.data ?? [];

  const handleFormSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!studentId) {
      setError("Please select a student.");
      return;
    }
    if (!date) {
      setError("Please select a date.");
      return;
    }
    if (!startTime) {
      setError("Please select a start time.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

      await onSubmit({
        studentId,
        scheduledStartAt: startDateTime.toISOString(),
        scheduledEndAt: endDateTime.toISOString(),
        durationMinutes: duration,
        classType,
      });
      onClose();
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to create manual class entry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleFormSubmit}>
        <DialogTitle sx={{ typography: "titleLg" }}>
          {defaultActive ? "Create Active Class Session" : "Create Manual Class Entry"}
        </DialogTitle>
        <DialogContent dividers>
          <ManualClassEntryFormFields
            error={error}
            studentId={studentId}
            setStudentId={setStudentId}
            loading={loading}
            studentsList={studentsList}
            date={date}
            setDate={setDate}
            startTime={startTime}
            setStartTime={setStartTime}
            duration={duration}
            setDuration={setDuration}
            classType={classType}
            setClassType={setClassType}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting || loading}>
            {submitting ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function renderStudentMenuItems(
  loading: boolean,
  studentsList: ReadonlyArray<{ readonly id?: string | null; readonly name?: string | null }>
) {
  if (loading) {
    return (
      <MenuItem value="" disabled>
        Loading students...
      </MenuItem>
    );
  }
  if (studentsList.length === 0) {
    return (
      <MenuItem value="" disabled>
        No students assigned to you
      </MenuItem>
    );
  }
  return studentsList.map(s => (
    <MenuItem key={s.id} value={s.id ?? ""}>
      {s.name}
    </MenuItem>
  ));
}

interface ManualClassEntryFormFieldsProps {
  readonly error: string | null;
  readonly studentId: string;
  readonly setStudentId: (value: string) => void;
  readonly loading: boolean;
  readonly studentsList: ReadonlyArray<{ readonly id?: string | null; readonly name?: string | null }>;
  readonly date: string;
  readonly setDate: (value: string) => void;
  readonly startTime: string;
  readonly setStartTime: (value: string) => void;
  readonly duration: number;
  readonly setDuration: (value: number) => void;
  readonly classType: string;
  readonly setClassType: (value: string) => void;
}

function ManualClassEntryFormFields({
  error,
  studentId,
  setStudentId,
  loading,
  studentsList,
  date,
  setDate,
  startTime,
  setStartTime,
  duration,
  setDuration,
  classType,
  setClassType,
}: Readonly<ManualClassEntryFormFieldsProps>) {
  return (
    <Stack spacing={3} sx={{ mt: 1 }}>
      {error && <Alert severity="error">{error}</Alert>}

      <FormControl fullWidth required>
        <InputLabel id="student-select-label">Student</InputLabel>
        <Select
          labelId="student-select-label"
          value={studentId}
          label="Student"
          onChange={e => setStudentId(e.target.value)}
          disabled={loading}
        >
          {renderStudentMenuItems(loading, studentsList)}
        </Select>
      </FormControl>

      <TextField
        label="Scheduled Date"
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
        label="Start Time"
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
        label="Duration (Minutes)"
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
        <InputLabel id="class-type-select-label">Class Type</InputLabel>
        <Select
          labelId="class-type-select-label"
          value={classType}
          label="Class Type"
          onChange={e => setClassType(e.target.value)}
        >
          <MenuItem value="REGULAR">Regular</MenuItem>
          <MenuItem value="TRIAL">Trial</MenuItem>
          <MenuItem value="PROMOTION">Promotion</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
}
