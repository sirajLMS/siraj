"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, TextField } from "@mui/material";

interface BillingMobileSearchBarProps {
  readonly value: string;
  readonly placeholder: string;
  readonly searchingLabel?: string;
  readonly isSearching?: boolean;
  readonly onChange: (value: string) => void;
}

export function BillingMobileSearchBar({
  value,
  placeholder,
  searchingLabel,
  isSearching = false,
  onChange,
}: Readonly<BillingMobileSearchBarProps>) {
  return (
    <Box sx={{ display: "flex", gap: 1 }}>
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
    </Box>
  );
}
