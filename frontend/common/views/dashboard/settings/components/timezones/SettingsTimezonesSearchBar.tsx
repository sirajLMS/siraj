"use client";

import { Box } from "@mui/material";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField/SearchBarField";
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
      <SearchBarField
        value={value}
        placeholder={placeholder}
        searchingLabel={searchingLabel}
        isSearching={isSearching}
        onChange={onChange}
      />
    </Box>
  );
}
