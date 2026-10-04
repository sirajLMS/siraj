"use client";

import { FormControl, InputLabel, MenuItem, Select, Stack } from "@mui/material";
import type { StudentSessionsViewModel } from "@/frontend/common/views/dashboard/student/sessions/useStudentSessionsViewModel";

type SessionsFiltersProps = Readonly<{
  subjectFilter: string;
  statusFilter: string;
  subjectOptions: readonly string[];
  statusOptions: readonly string[];
  labels: StudentSessionsViewModel["labels"];
  onSubjectFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
}>;

export function SessionsFilters({
  subjectFilter,
  statusFilter,
  subjectOptions,
  statusOptions,
  labels,
  onSubjectFilterChange,
  onStatusFilterChange,
}: SessionsFiltersProps) {
  return (
    <Stack direction="row" spacing={2}>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel id="sessions-subject-filter" shrink>
          {labels.filterBySubject}
        </InputLabel>
        <Select
          labelId="sessions-subject-filter"
          label={labels.filterBySubject}
          value={subjectFilter}
          onChange={e => onSubjectFilterChange(e.target.value)}
        >
          <MenuItem value="">{labels.allSubjects}</MenuItem>
          {subjectOptions.map(subject => (
            <MenuItem key={subject} value={subject}>
              {subject}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel id="sessions-status-filter" shrink>
          {labels.filterByStatus}
        </InputLabel>
        <Select
          labelId="sessions-status-filter"
          label={labels.filterByStatus}
          value={statusFilter}
          onChange={e => onStatusFilterChange(e.target.value)}
        >
          <MenuItem value="">{labels.allStatuses}</MenuItem>
          {statusOptions.map(status => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}
