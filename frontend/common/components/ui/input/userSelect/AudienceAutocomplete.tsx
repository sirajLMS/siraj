"use client";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import Autocomplete from "@mui/material/Autocomplete";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { useMemo } from "react";
import type { AudienceAutocompleteProps, PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { UserSelectOptionRow } from "@/frontend/common/components/ui/input/userSelect/UserSelectOptionRow";

const passThroughFilter = (options: PersonOption[]) => options;

export function AudienceAutocomplete({
  value,
  onChange,
  options,
  loading = false,
  inputValue,
  onInputChange,
  label,
  placeholder,
  noOptionsText,
  error = false,
  helperText,
  disabled = false,
  required = false,
  size = "medium",
  sx,
  slotProps,
  fullWidth = true,
  excludeIds,
}: AudienceAutocompleteProps) {
  // Optimization: Pre-convert excludeIds array to a Set for O(1) lookups instead of O(M) Array.includes.
  // Memoizing visibleOptions avoids O(N*M) array filtering and unnecessary shallow array copies on every re-render / typing keystroke.
  const visibleOptions = useMemo(() => {
    if (!excludeIds || excludeIds.length === 0) {
      return options;
    }
    const excludeSet = new Set(excludeIds);
    return options.filter(option => !excludeSet.has(option.id));
  }, [options, excludeIds]);

  return (
    <Autocomplete<PersonOption>
      fullWidth={fullWidth}
      size={size}
      options={visibleOptions}
      loading={loading}
      disabled={disabled}
      value={value}
      inputValue={inputValue}
      onInputChange={(_event, next, reason) => {
        if (reason === "reset") {
          return;
        }
        onInputChange(next);
        if (value && next !== value.name) {
          onChange(null);
        }
      }}
      onChange={(_event, next) => {
        onChange(next);
      }}
      filterOptions={passThroughFilter}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      getOptionLabel={option => option.name}
      getOptionKey={option => option.id}
      noOptionsText={noOptionsText}
      sx={sx}
      slotProps={slotProps}
      renderOption={(props, option) => {
        // MUI injects `key` into renderOption props; we discard it via `_` prefix
        // (per the project's `no-unused-vars` underscore convention) and provide
        // our own explicit <li> key from the option id. The underscore-prefixed
        // discard is honored by @typescript-eslint/no-unused-vars but not by
        // sonarjs/no-unused-vars (which has no ignore options) — see eslint.config.mjs.
        const { key: _muiKey, ...rest } = props;
        return (
          <li key={option.id} {...rest}>
            <UserSelectOptionRow option={option} showEmail={Boolean(option.email)} />
          </li>
        );
      }}
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          required={required}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps?.input,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <SearchOutlinedIcon fontSize="small" />
                  </InputAdornment>
                  {params.slotProps?.input &&
                  typeof params.slotProps.input === "object" &&
                  "startAdornment" in params.slotProps.input
                    ? params.slotProps.input.startAdornment
                    : null}
                </>
              ),
            },
            htmlInput: {
              ...params.slotProps?.htmlInput,
              autoComplete: "off",
            },
          }}
        />
      )}
    />
  );
}
