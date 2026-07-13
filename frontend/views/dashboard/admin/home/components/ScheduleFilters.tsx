"use client";

import { Autocomplete, Box, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import { DateNavigator } from "@/frontend/common/components/ui";
import type { TeacherFilterItem } from "@/frontend/views/dashboard/types/dashboard";

const StyledFiltersContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  alignItems: "stretch",
  width: "100%",
  [theme.breakpoints.up("md")]: {
    flexDirection: "row",
    alignItems: "flex-end",
    width: "auto",
  },
}));

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
  const selectedTeacher = teachers.find(teacher => teacher.id === teacherValue) || null;

  return (
    <StyledFiltersContainer>
      <Box sx={{ width: "100%", minWidth: 0 }}>
        <DateNavigator
          dateValue={dateValue}
          todayLabel={todayLabel}
          previousDayLabel={previousDayLabel}
          nextDayLabel={nextDayLabel}
          dateLabel={dateLabel}
          onDateChange={onDateChange}
        />
      </Box>

      <Autocomplete
        size="small"
        sx={{ width: "100%", minWidth: { xs: 0, md: 200 } }}
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
