"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, TextField } from "@mui/material";
import type { SettingsTimezonesSearchBarProps } from "@/frontend/common/views/dashboard/settings/types/settingsTimezones.types";

export function SettingsTimezonesSearchBar({
  value,
  placeholder,
  searchingLabel,
  isSearching,
  onChange,
}: Readonly<SettingsTimezonesSearchBarProps>) {
  return (
    <Box sx={{ maxWidth: { xs: "100%", md: 420 } }}>
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
