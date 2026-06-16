"use client";

import type { SelectChangeEvent } from "@mui/material";
import { Box, Button, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { format, isValid, parse } from "date-fns";
import { AppDatePicker } from "@/frontend/components/ui/form/AppDatePicker";

interface ScheduleFiltersProps {
  readonly dateLabel: string;
  readonly dateValue: string;
  readonly teacherPlaceholder: string;
  readonly teacherValue: string;
  readonly submitLabel: string;
  readonly onDateChange: (date: string) => void;
  readonly onTeacherChange: (teacher: string) => void;
  readonly onSubmit: () => void;
}

const MOCK_TEACHERS = [
  { id: "", name: "" },
  { id: "ahmed-omar", name: "Ahmed Omar" },
  { id: "sarah-johnson", name: "Sarah Johnson" },
  { id: "omar-said", name: "Omar Said" },
];

const DATE_FILTER_FORMAT = "yyyy-MM-dd";

function parseFilterDate(date: string): Date | null {
  if (date.length === 0) {
    return null;
  }

  const parsedDate = parse(date, DATE_FILTER_FORMAT, new Date());

  return isValid(parsedDate) ? parsedDate : null;
}

export function ScheduleFilters({
  dateLabel,
  dateValue,
  teacherPlaceholder,
  teacherValue,
  submitLabel,
  onDateChange,
  onTeacherChange,
  onSubmit,
}: Readonly<ScheduleFiltersProps>) {
  const selectedDate = parseFilterDate(dateValue);

  const handleTeacherSelect = (event: SelectChangeEvent) => {
    onTeacherChange(event.target.value);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        alignItems: { xs: "stretch", sm: "flex-end" },
      }}
    >
      <AppDatePicker
        label={dateLabel}
        value={selectedDate}
        onChange={(date: Date | null) => {
          onDateChange(date && isValid(date) ? format(date, DATE_FILTER_FORMAT) : "");
        }}
        slotProps={{
          textField: {
            size: "small",
            sx: { minWidth: 180 },
            slotProps: { htmlInput: { autoComplete: "off" } },
          },
        }}
      />

      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel id="teacher-filter-label">{teacherPlaceholder}</InputLabel>
        <Select
          labelId="teacher-filter-label"
          value={teacherValue}
          label={teacherPlaceholder}
          onChange={handleTeacherSelect}
        >
          <MenuItem value="">
            <em>{teacherPlaceholder}</em>
          </MenuItem>
          {MOCK_TEACHERS.filter(teacher => teacher.id !== "").map(teacher => (
            <MenuItem key={teacher.id} value={teacher.id}>
              {teacher.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="contained"
        onClick={onSubmit}
        sx={{
          borderRadius: 6,
          px: 4,
          textTransform: "uppercase",
          fontWeight: 600,
          fontFamily: '"Inter", sans-serif',
          fontSize: "12px",
          letterSpacing: "0.1em",
          height: 40,
        }}
      >
        {submitLabel}
      </Button>
    </Box>
  );
}
