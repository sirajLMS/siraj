"use client";

import { SortOutlined } from "@mui/icons-material";
import { alpha, IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import { AvailabilitySearchSortBy } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { isSortApplied } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterUtils";
import type { SearchScheduleSortMenuProps } from "@/frontend/common/views/dashboard/search-schedule/types";
import { getSortLabelKey } from "@/frontend/common/views/dashboard/search-schedule/utils";
import { useAppTranslation } from "@/shared/locale";

export function SearchScheduleSortMenuMobile({
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
          onClick={() => onSortChange(AvailabilitySearchSortBy.MostAvailableDays)}
        >
          {t.sortOptions.mostAvailableDays}
        </MenuItem>
        <MenuItem
          selected={sortBy === AvailabilitySearchSortBy.MostGaps}
          onClick={() => onSortChange(AvailabilitySearchSortBy.MostGaps)}
        >
          {t.sortOptions.mostGaps}
        </MenuItem>
        <MenuItem
          selected={sortBy === AvailabilitySearchSortBy.NameAsc}
          onClick={() => onSortChange(AvailabilitySearchSortBy.NameAsc)}
        >
          {t.sortOptions.nameAsc}
        </MenuItem>
        <MenuItem
          selected={sortBy === AvailabilitySearchSortBy.NameDesc}
          onClick={() => onSortChange(AvailabilitySearchSortBy.NameDesc)}
        >
          {t.sortOptions.nameDesc}
        </MenuItem>
        <MenuItem
          selected={sortBy === AvailabilitySearchSortBy.TimezoneAsc}
          onClick={() => onSortChange(AvailabilitySearchSortBy.TimezoneAsc)}
        >
          {t.sortOptions.timezoneAsc}
        </MenuItem>
      </Menu>
    </>
  );
}
