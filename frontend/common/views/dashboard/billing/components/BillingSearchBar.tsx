"use client";

import { Box, TextField } from "@mui/material";

interface BillingSearchBarProps {
  readonly value: string;
  readonly placeholder: string;
  readonly searchingLabel?: string;
  readonly isSearching?: boolean;
  readonly onChange: (value: string) => void;
}

export function BillingSearchBar({
  value,
  placeholder,
  searchingLabel,
  isSearching = false,
  onChange,
}: Readonly<BillingSearchBarProps>) {
  return (
    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
      <TextField
        size="small"
        value={value}
        onChange={event => {
          onChange(event.target.value);
        }}
        placeholder={placeholder}
        helperText={isSearching ? searchingLabel : undefined}
        slotProps={{ htmlInput: { autoComplete: "off" } }}
      />
    </Box>
  );
}
