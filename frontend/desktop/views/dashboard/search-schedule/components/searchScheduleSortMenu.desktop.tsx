"use client";

import { SortOutlined } from "@mui/icons-material";
import { alpha, IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import { AvailabilitySearchSortBy } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { isSortApplied } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterUtils";
import type { SearchScheduleSortMenuProps } from "@/frontend/common/views/dashboard/search-schedule/types";
import { getSortLabelKey } from "@/frontend/common/views/dashboard/search-schedule/utils";

export function SearchScheduleSortMenuDesktop({
  labels,
  sortBy,
  sortMenuAnchorEl,
  onSortMenuOpen,
  onSortMenuClose,
  onSortChange,
}: Readonly<SearchScheduleSortMenuProps>) {
  const open = Boolean(sortMenuAnchorEl);
  const sortActive = isSortApplied(sortBy);
  const currentSortLabel = labels.sortOptions[getSortLabelKey(sortBy)];

  const handleSelect = (value: AvailabilitySearchSortBy) => {
    onSortChange(value);
    onSortMenuClose();
  };

  return (
    <>
      <Tooltip title={`${labels.sort}: ${currentSortLabel}`}>
        <IconButton
          aria-label={labels.sort}
          aria-pressed={sortActive}
          onClick={onSortMenuOpen}
          size="small"
          color={sortActive ? "primary" : "default"}
          sx={theme => ({
            ...(sortActive ? { backgroundColor: alpha(theme.palette.primary.main, 0.12) } : {}),
          })}
        >
          <SortOutlined fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu anchorEl={sortMenuAnchorEl} open={open} onClose={onSortMenuClose}>
        <MenuItem
          selected={sortBy === AvailabilitySearchSortBy.MostAvailableDays}
          onClick={() => handleSelect(AvailabilitySearchSortBy.MostAvailableDays)}
        >
          {labels.sortOptions.mostAvailableDays}
        </MenuItem>
        <MenuItem
          selected={sortBy === AvailabilitySearchSortBy.MostGaps}
          onClick={() => handleSelect(AvailabilitySearchSortBy.MostGaps)}
        >
          {labels.sortOptions.mostGaps}
        </MenuItem>
        <MenuItem
          selected={sortBy === AvailabilitySearchSortBy.NameAsc}
          onClick={() => handleSelect(AvailabilitySearchSortBy.NameAsc)}
        >
          {labels.sortOptions.nameAsc}
        </MenuItem>
        <MenuItem
          selected={sortBy === AvailabilitySearchSortBy.NameDesc}
          onClick={() => handleSelect(AvailabilitySearchSortBy.NameDesc)}
        >
          {labels.sortOptions.nameDesc}
        </MenuItem>
        <MenuItem
          selected={sortBy === AvailabilitySearchSortBy.TimezoneAsc}
          onClick={() => handleSelect(AvailabilitySearchSortBy.TimezoneAsc)}
        >
          {labels.sortOptions.timezoneAsc}
        </MenuItem>
      </Menu>
    </>
  );
}
