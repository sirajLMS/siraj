"use client";

import { Box } from "@mui/material";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField/SearchBarField";
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
