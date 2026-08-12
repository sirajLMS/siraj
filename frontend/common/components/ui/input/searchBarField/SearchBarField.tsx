"use client";

import { SearchOutlined } from "@mui/icons-material";
import { InputAdornment, TextField } from "@mui/material";

export interface SearchBarFieldProps {
  readonly value: string;
  readonly placeholder: string;
  readonly searchingLabel?: string;
  readonly isSearching?: boolean;
  readonly onChange: (value: string) => void;
}

/**
 * Shared search bar field: TextField with search icon adornment and optional
 * searching helper text. Both common and mobile search bar wrappers delegate
 * here, supplying their own outer layout/Box.
 */
export function SearchBarField({
  value,
  placeholder,
  searchingLabel,
  isSearching = false,
  onChange,
}: Readonly<SearchBarFieldProps>) {
  return (
    <TextField
      fullWidth
      size="small"
      value={value}
      onChange={event => {
        onChange(event.target.value);
      }}
      placeholder={placeholder}
      helperText={isSearching ? searchingLabel : undefined}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchOutlined fontSize="small" />
            </InputAdornment>
          ),
        },
        htmlInput: { autoComplete: "off" },
      }}
    />
  );
}
