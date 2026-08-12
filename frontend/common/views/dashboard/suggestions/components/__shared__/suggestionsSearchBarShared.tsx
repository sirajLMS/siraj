"use client";

import { SearchOutlined } from "@mui/icons-material";
import { InputAdornment, TextField } from "@mui/material";
import type { SuggestionsSearchBarProps } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";

interface SuggestionsSearchBarSharedProps extends SuggestionsSearchBarProps {
  /** Whether the search bar should expand to fill available width (mobile: true, desktop: false). */
  readonly fullWidth?: boolean;
  /** Minimum width when not fullWidth (desktop: 240). Ignored when fullWidth is true. */
  readonly minWidth?: number;
}

export function SuggestionsSearchBarShared({
  value,
  placeholder,
  onChange,
  fullWidth = false,
  minWidth = 240,
}: Readonly<SuggestionsSearchBarSharedProps>) {
  return (
    <TextField
      size="small"
      value={value}
      placeholder={placeholder}
      onChange={event => {
        onChange(event.target.value);
      }}
      fullWidth={fullWidth}
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
      sx={fullWidth ? undefined : { minWidth }}
    />
  );
}
