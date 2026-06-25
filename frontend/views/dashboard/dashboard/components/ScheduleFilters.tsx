"use client";

import { Autocomplete, Box, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import { format, isValid, parse } from "date-fns";
import { AppDatePicker } from "@/frontend/components/ui/form/AppDatePicker";

import type { TeacherFilterItem } from "@/frontend/views/dashboard/types/dashboard";

// Styled container for the filter row - responsive layout with column on mobile, row on desktop
const StyledFiltersContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  alignItems: "stretch",
  [theme.breakpoints.up("sm")]: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
}));

interface ScheduleFiltersProps {
  readonly dateLabel: string;
  readonly dateValue: string;
  readonly teacherPlaceholder: string;
  readonly teacherValue: string;
  readonly submitLabel: string;
  readonly teachers: readonly TeacherFilterItem[];
  readonly loadingTeachers?: boolean;
  readonly teacherSearchValue?: string;
  readonly onTeacherSearchChange?: (search: string) => void;
  readonly onDateChange: (date: string) => void;
  readonly onTeacherChange: (teacher: string) => void;
  readonly onSubmit: () => void;
}

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
  // submitLabel,
  teachers,
  loadingTeachers = false,
  teacherSearchValue,
  onTeacherSearchChange,
  onDateChange,
  onTeacherChange,
  // onSubmit,
}: Readonly<ScheduleFiltersProps>) {
  const selectedDate = parseFilterDate(dateValue);

  // Ensure the selected teacher is always in the options list if they are selected
  // but not in the current search results
  const selectedTeacher = teachers.find(t => t.id === teacherValue) || null;

  return (
    <StyledFiltersContainer>
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

      <Autocomplete
        size="small"
        sx={{ minWidth: 200 }}
        options={teachers}
        getOptionLabel={option => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        value={selectedTeacher}
        {...(onTeacherSearchChange
          ? {
              inputValue: teacherSearchValue ?? "",
              onInputChange: (_event, newInputValue, reason) => {
                if (reason !== "reset") {
                  onTeacherSearchChange(newInputValue);
                }
              },
            }
          : {})}
        onChange={(_event, newValue) => {
          onTeacherChange(newValue?.id ?? "");
          if (onTeacherSearchChange) {
            onTeacherSearchChange(newValue?.name ?? "");
          }
        }}
        loading={loadingTeachers}
        renderInput={params => <TextField {...params} label={teacherPlaceholder} placeholder={teacherPlaceholder} />}
      />

      {/* <Button
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
      </Button> */}
    </StyledFiltersContainer>
  );
}
