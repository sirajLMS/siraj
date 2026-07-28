"use client";

import { AudienceAutocomplete } from "@/frontend/common/components/ui/input/userSelect/AudienceAutocomplete";
import type { TeacherAutocompleteProps } from "@/frontend/common/components/ui/input/userSelect/types";
import { useTeacherAutocomplete } from "@/frontend/common/hooks/userAutocomplete";
import { Translation, useAppTranslation } from "@/shared/locale";

export function TeacherAutocomplete({
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
  skip,
}: TeacherAutocompleteProps & { readonly skip?: boolean }) {
  const t = useAppTranslation(Translation.Ui.UserSelect);
  const { options, loading, inputValue, onInputChange } = useTeacherAutocomplete({ value, skip });

  return (
    <AudienceAutocomplete
      value={value}
      onChange={onChange}
      options={options}
      loading={loading}
      inputValue={inputValue}
      onInputChange={onInputChange}
      label={label ?? t.teacherLabel}
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
