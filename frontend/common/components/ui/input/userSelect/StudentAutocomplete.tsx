"use client";

import { useMemo } from "react";
import { AudienceAutocomplete } from "@/frontend/common/components/ui/input/userSelect/AudienceAutocomplete";
import type { StudentAutocompleteProps } from "@/frontend/common/components/ui/input/userSelect/types";
import { USER_SELECT_LIMIT } from "@/frontend/common/components/ui/input/userSelect/userSelect.constants";
import { useStudentAutocomplete } from "@/frontend/common/hooks/userAutocomplete";
import { useAppTranslation } from "@/shared/locale";

export function StudentAutocomplete({
  value,
  onChange,
  label,
  placeholder,
  error,
  helperText,
  disabled,
  required,
  size,
  sx,
  slotProps,
  fullWidth,
  scope,
  skip,
}: StudentAutocompleteProps) {
  const t = useAppTranslation().uiTranslations.userSelect;
  const { options, loading, inputValue, onInputChange } = useStudentAutocomplete({ value, scope, skip });

  const usesServerSearch = !scope?.parentId && !scope?.viewerAssigned && !scope?.primaryTeacherId;

  const displayOptions = useMemo(() => {
    if (usesServerSearch) {
      return options;
    }
    const query = inputValue.trim().toLowerCase();
    const filtered = query ? options.filter(option => option.name.toLowerCase().includes(query)) : options;
    return filtered.slice(0, USER_SELECT_LIMIT);
  }, [inputValue, options, usesServerSearch]);

  return (
    <AudienceAutocomplete
      value={value}
      onChange={onChange}
      options={displayOptions}
      loading={loading}
      inputValue={inputValue}
      onInputChange={onInputChange}
      label={label ?? t.studentLabel}
      placeholder={placeholder ?? t.searchPlaceholder}
      noOptionsText={t.noResults}
      error={error}
      helperText={helperText}
      disabled={disabled}
      required={required}
      size={size}
      sx={sx}
      slotProps={slotProps}
      fullWidth={fullWidth}
    />
  );
}
