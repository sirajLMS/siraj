"use client";

import { ClearOutlined, SearchOutlined } from "@mui/icons-material";
import { IconButton, InputAdornment, TextField, Tooltip } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { KeyboardEvent } from "react";

export interface SearchBarFieldProps {
  readonly value: string;
  readonly placeholder: string;
  readonly searchingLabel?: string;
  readonly isSearching?: boolean;
  readonly onChange: (value: string) => void;
  readonly sx?: SxProps<Theme>;
  readonly clearLabel?: string;
  /** Cap mirrored onto the native input's maxLength when the consumer enforces one. */
  readonly maxLength?: number;
}

/**
 * Shared search bar field: TextField with search icon adornment, optional
 * clear button when input is non-empty, and optional searching helper text.
 * Both common and mobile search bar wrappers delegate here, supplying their
 * own outer layout/Box.
 */
export function SearchBarField({
  value,
  placeholder,
  searchingLabel,
  isSearching = false,
  onChange,
  sx,
  clearLabel = "Clear search",
  maxLength,
}: Readonly<SearchBarFieldProps>) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && value) {
      event.preventDefault();
      event.stopPropagation();
      onChange("");
    }
  };

  return (
    <TextField
      fullWidth
      size="small"
      value={value}
      onChange={event => {
        onChange(event.target.value);
      }}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      helperText={isSearching ? searchingLabel : undefined}
      sx={sx}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchOutlined fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end">
              <Tooltip title={clearLabel}>
                <IconButton size="small" aria-label={clearLabel} onClick={() => onChange("")} edge="end">
                  <ClearOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ) : null,
        },
        htmlInput: {
          "aria-label": placeholder,
          autoComplete: "off",
          ...(maxLength === undefined ? null : { maxLength }),
        },
      }}
    />
  );
}
