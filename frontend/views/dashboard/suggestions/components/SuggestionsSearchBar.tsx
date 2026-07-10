"use client";

import { SearchOutlined } from "@mui/icons-material";
import { InputAdornment, TextField } from "@mui/material";
import type { SuggestionsSearchBarProps } from "@/frontend/views/dashboard/suggestions/types/suggestionsView.types";

export function SuggestionsSearchBar({ value, placeholder, onChange }: Readonly<SuggestionsSearchBarProps>) {
  return (
    <TextField
      size="small"
      value={value}
      placeholder={placeholder}
      onChange={event => {
        onChange(event.target.value);
      }}
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
      sx={{ minWidth: 240 }}
    />
  );
}
