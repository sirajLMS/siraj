"use client";

import { FilterListOutlined } from "@mui/icons-material";
import { Box, TextField } from "@mui/material";
import { FilterButton } from "@/frontend/components/ui";

interface BillingSearchBarProps {
  readonly value: string;
  readonly placeholder: string;
  readonly filterLabel: string;
  readonly onChange: (value: string) => void;
}

export function BillingSearchBar({ value, placeholder, filterLabel, onChange }: Readonly<BillingSearchBarProps>) {
  return (
    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
      <TextField
        size="small"
        value={value}
        onChange={event => {
          onChange(event.target.value);
        }}
        placeholder={placeholder}
        slotProps={{ htmlInput: { autoComplete: "off" } }}
      />
      <FilterButton startIcon={<FilterListOutlined />}>{filterLabel}</FilterButton>
    </Box>
  );
}
