"use client";

import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Autocomplete, Box, Button, IconButton, TextField, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import { format, isValid } from "date-fns";
import { AppDatePicker } from "@/frontend/components/ui/form/AppDatePicker";

import type { TeacherFilterItem } from "@/frontend/views/dashboard/types/dashboard";
import {
  getTodayScheduleFilterDate,
  isScheduleFilterDateToday,
  parseScheduleFilterDate,
  shiftScheduleFilterDate,
} from "@/frontend/views/dashboard/dashboard/utils/scheduleFilterDate";

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

const StyledDateControls = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-end",
  gap: theme.spacing(1),
}));

const StyledDateNavButton = styled(IconButton)(({ theme }) => ({
  border: `1px solid ${theme.palette.border.light}`,
  borderRadius: Number(theme.shape.borderRadius),
  backgroundColor: theme.palette.surfaceContainerLowest,
  width: 40,
  height: 40,
  "&.Mui-disabled": {
    opacity: 0.5,
  },
}));

const DATE_FILTER_FORMAT = "yyyy-MM-dd";

interface ScheduleFiltersProps {
  readonly dateLabel: string;
  readonly dateValue: string;
  readonly todayLabel: string;
  readonly previousDayLabel: string;
  readonly nextDayLabel: string;
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

export function ScheduleFilters({
  dateLabel,
  dateValue,
  todayLabel,
  previousDayLabel,
  nextDayLabel,
  teacherPlaceholder,
  teacherValue,
  teachers,
  loadingTeachers = false,
  teacherSearchValue,
  onTeacherSearchChange,
  onDateChange,
  onTeacherChange,
}: Readonly<ScheduleFiltersProps>) {
  const selectedDate = parseScheduleFilterDate(dateValue);
  const isTodaySelected = isScheduleFilterDateToday(dateValue);

  const selectedTeacher = teachers.find(teacher => teacher.id === teacherValue) || null;

  return (
    <StyledFiltersContainer>
      <StyledDateControls>
        <Tooltip title={previousDayLabel}>
          <StyledDateNavButton
            size="small"
            aria-label={previousDayLabel}
            onClick={() => onDateChange(shiftScheduleFilterDate(dateValue, -1))}
          >
            <ChevronLeft fontSize="small" />
          </StyledDateNavButton>
        </Tooltip>

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

        <Tooltip title={nextDayLabel}>
          <StyledDateNavButton
            size="small"
            aria-label={nextDayLabel}
            onClick={() => onDateChange(shiftScheduleFilterDate(dateValue, 1))}
          >
            <ChevronRight fontSize="small" />
          </StyledDateNavButton>
        </Tooltip>

        <Button
          variant="text"
          size="small"
          disabled={isTodaySelected}
          onClick={() => onDateChange(getTodayScheduleFilterDate())}
          sx={{ minWidth: 64, height: 40 }}
        >
          {todayLabel}
        </Button>
      </StyledDateControls>

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
    </StyledFiltersContainer>
  );
}
