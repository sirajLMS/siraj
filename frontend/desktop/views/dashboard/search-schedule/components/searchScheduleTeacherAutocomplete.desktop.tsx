"use client";

import { Autocomplete, TextField } from "@mui/material";
import type { SearchScheduleTeacherAutocompleteProps } from "@/frontend/common/views/dashboard/search-schedule/types";
import { useAppTranslation } from "@/shared/locale";

export function SearchScheduleTeacherAutocompleteDesktop({
  size = "small",
  teacherSearchInput,
  selectedTeacher,
  teacherOptions,
  teacherSearchLoading,
  shouldSearchTeachers,
  onTeacherSearchInputChange,
  onSelectTeacher,
}: Readonly<SearchScheduleTeacherAutocompleteProps>) {
  const t = useAppTranslation().dashboardTranslations.coreSearchSchedule;

  return (
    <Autocomplete
      options={[...teacherOptions]}
      getOptionLabel={option => option.name}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      value={selectedTeacher}
      inputValue={teacherSearchInput}
      onInputChange={(_event, newInputValue, reason) => {
        if (reason === "reset") {
          return;
        }

        onTeacherSearchInputChange(newInputValue);
        if (selectedTeacher && newInputValue !== selectedTeacher.name) {
          onSelectTeacher(null);
        }
      }}
      onChange={(_event, newValue) => {
        onSelectTeacher(newValue);
      }}
      loading={teacherSearchLoading}
      renderInput={params => (
        <TextField
          {...params}
          label={t.teacherName}
          placeholder={t.teacherNamePlaceholder}
          size={size}
          slotProps={{
            ...params.slotProps,
            htmlInput: {
              ...params.slotProps?.htmlInput,
              autoComplete: "off",
            },
          }}
        />
      )}
      noOptionsText={shouldSearchTeachers ? t.teacherNameNoResults : t.teacherNameTypeToSearch}
    />
  );
}
