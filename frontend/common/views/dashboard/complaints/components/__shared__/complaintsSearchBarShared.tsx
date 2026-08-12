"use client";

import { SearchOutlined } from "@mui/icons-material";
import { InputAdornment, TextField } from "@mui/material";

export interface ComplaintsSearchBarSharedOptions {
  readonly fieldSx: Record<string, unknown>;
}

export interface ComplaintsSearchBarSlotProps {
  readonly value: string;
  readonly placeholder: string;
  readonly onChange: (value: string) => void;
}

export interface ComplaintsSearchBarSharedProps extends ComplaintsSearchBarSlotProps {
  readonly options: ComplaintsSearchBarSharedOptions;
}

export function ComplaintsSearchBarShared({
  value,
  placeholder,
  onChange,
  options,
}: Readonly<ComplaintsSearchBarSharedProps>) {
  return (
    <TextField
      size="small"
      value={value}
      placeholder={placeholder}
      onChange={event => {
        onChange(event.target.value);
      }}
      sx={options.fieldSx}
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
