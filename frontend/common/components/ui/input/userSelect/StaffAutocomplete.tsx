"use client";

import { AudienceAutocomplete } from "@/frontend/common/components/ui/input/userSelect/AudienceAutocomplete";
import type { StaffAutocompleteProps } from "@/frontend/common/components/ui/input/userSelect/types";
import { useStaffAutocomplete } from "@/frontend/common/hooks/userAutocomplete";
import { Translation, useAppTranslation } from "@/shared/locale";

export function StaffAutocomplete({
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
}: StaffAutocompleteProps) {
  const t = useAppTranslation(Translation.Ui.UserSelect);
  const { options, loading, inputValue, onInputChange } = useStaffAutocomplete({ value, scope, skip });

  return (
    <AudienceAutocomplete
      value={value}
      onChange={onChange}
      options={options}
      loading={loading}
      inputValue={inputValue}
      onInputChange={onInputChange}
      label={label ?? t.staffLabel}
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
