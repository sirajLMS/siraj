"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, TextField } from "@mui/material";
import type { BillingSearchBarProps } from "@/frontend/common/views/dashboard/billing/types/billingSearchBar.types";

export function BillingMobileSearchBarMobile({
  value,
  placeholder,
  searchingLabel,
  isSearching = false,
  onChange,
}: Readonly<BillingSearchBarProps>) {
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
