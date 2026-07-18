"use client";

import { Box, TextField } from "@mui/material";
import type { BillingSearchBarProps } from "@/frontend/common/views/dashboard/billing/types/billingSearchBar.types";

export function BillingSearchBarDesktop({
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
