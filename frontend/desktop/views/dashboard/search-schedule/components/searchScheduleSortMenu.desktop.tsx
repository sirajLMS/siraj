"use client";

import { SortOutlined } from "@mui/icons-material";
import { alpha, IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import { AvailabilitySearchSortBy } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { isSortApplied } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterUtils";
import type { SearchScheduleSortMenuProps } from "@/frontend/common/views/dashboard/search-schedule/types";
import { getSortLabelKey } from "@/frontend/common/views/dashboard/search-schedule/utils";
import { useAppTranslation } from "@/shared/locale";

export function SearchScheduleSortMenuDesktop({
  sortBy,
  sortMenuAnchorEl,
  onSortMenuOpen,
  onSortMenuClose,
  onSortChange,
}: Readonly<SearchScheduleSortMenuProps>) {
  const t = useAppTranslation().dashboardTranslations.coreSearchSchedule;
  const open = Boolean(sortMenuAnchorEl);
  const sortActive = isSortApplied(sortBy);
  const currentSortLabel = t.sortOptions[getSortLabelKey(sortBy)];

  const handleSelect = (value: AvailabilitySearchSortBy) => {
    onSortChange(value);
    onSortMenuClose();
  };

  return (
    <>
      <Tooltip title={`${t.sort}: ${currentSortLabel}`}>
        <IconButton
          aria-label={t.sort}
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
          {t.sortOptions.mostAvailableDays}
        </MenuItem>
        <MenuItem
          selected={sortBy === AvailabilitySearchSortBy.MostGaps}
          onClick={() => handleSelect(AvailabilitySearchSortBy.MostGaps)}
        >
          {t.sortOptions.mostGaps}
        </MenuItem>
        <MenuItem
          selected={sortBy === AvailabilitySearchSortBy.NameAsc}
          onClick={() => handleSelect(AvailabilitySearchSortBy.NameAsc)}
        >
          {t.sortOptions.nameAsc}
        </MenuItem>
        <MenuItem
          selected={sortBy === AvailabilitySearchSortBy.NameDesc}
          onClick={() => handleSelect(AvailabilitySearchSortBy.NameDesc)}
        >
          {t.sortOptions.nameDesc}
        </MenuItem>
        <MenuItem
          selected={sortBy === AvailabilitySearchSortBy.TimezoneAsc}
          onClick={() => handleSelect(AvailabilitySearchSortBy.TimezoneAsc)}
        >
          {t.sortOptions.timezoneAsc}
        </MenuItem>
      </Menu>
    </>
  );
}
