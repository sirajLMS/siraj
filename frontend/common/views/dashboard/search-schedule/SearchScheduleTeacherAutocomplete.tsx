"use client";

import { useQuery } from "@apollo/client/react";
import { Autocomplete, TextField } from "@mui/material";
import { useEffect, useMemo } from "react";
import { teachersQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { type SearchScheduleTeacherOption, useSearchScheduleStore } from "@/frontend/common/stores/searchScheduleStore";
import { useAppTranslation } from "@/shared/locale/client";

const DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;
const TEACHER_SEARCH_LIMIT = 10;

interface SearchScheduleTeacherAutocompleteProps {
  readonly size?: "small" | "medium";
}

export function SearchScheduleTeacherAutocomplete({
  size = "small",
}: Readonly<SearchScheduleTeacherAutocompleteProps>) {
  const t = useAppTranslation("dashboard.core.searchSchedule");

  const teacherSearchInput = useSearchScheduleStore(state => state.teacherSearchInput);
  const debouncedTeacherSearch = useSearchScheduleStore(state => state.debouncedTeacherSearch);
  const selectedTeacher = useSearchScheduleStore(state => state.selectedTeacher);
  const setTeacherSearchInput = useSearchScheduleStore(state => state.setTeacherSearchInput);
  const setDebouncedTeacherSearch = useSearchScheduleStore(state => state.setDebouncedTeacherSearch);
  const setSelectedTeacher = useSearchScheduleStore(state => state.setSelectedTeacher);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTeacherSearch(teacherSearchInput.trim());
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [teacherSearchInput, setDebouncedTeacherSearch]);

  const shouldSearch = debouncedTeacherSearch.length >= MIN_SEARCH_LENGTH;

  const { data, loading } = useQuery(teachersQueryDocument, {
    variables: {
      search: debouncedTeacherSearch,
      limit: TEACHER_SEARCH_LIMIT,
    },
    skip: !shouldSearch,
    fetchPolicy: "cache-and-network",
  });

  const options = useMemo((): SearchScheduleTeacherOption[] => {
    const teachers =
      data?.teachers?.map(teacher => ({
        id: teacher.id ?? "",
        name: teacher.name ?? "",
      })) ?? [];

    if (selectedTeacher && !teachers.some(teacher => teacher.id === selectedTeacher.id)) {
      return [selectedTeacher, ...teachers];
    }

    return teachers;
  }, [data?.teachers, selectedTeacher]);

  return (
    <Autocomplete
      options={options}
      getOptionLabel={option => option.name}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      value={selectedTeacher}
      inputValue={teacherSearchInput}
      onInputChange={(_event, newInputValue, reason) => {
        if (reason === "reset") {
          return;
        }

        setTeacherSearchInput(newInputValue);
        if (selectedTeacher && newInputValue !== selectedTeacher.name) {
          setSelectedTeacher(null);
        }
      }}
      onChange={(_event, newValue) => {
        setSelectedTeacher(newValue);
      }}
      loading={loading}
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
      noOptionsText={shouldSearch ? t.teacherNameNoResults : t.teacherNameTypeToSearch}
    />
  );
}
