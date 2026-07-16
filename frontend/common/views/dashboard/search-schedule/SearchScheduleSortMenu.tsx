"use client";

import { SortOutlined } from "@mui/icons-material";
import { alpha, IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import { type MouseEvent, useState } from "react";
import { AvailabilitySearchSortBy } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { SearchScheduleDraftFilters } from "@/frontend/common/stores/searchScheduleStore";
import { isSortApplied } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterUtils";
import { useAppTranslation } from "@/shared/locale/client";

interface SearchScheduleSortMenuProps {
  readonly sortBy: SearchScheduleDraftFilters["sortBy"];
  readonly onSortChange: (sortBy: AvailabilitySearchSortBy) => void;
}

function getSortLabelKey(
  sortBy: AvailabilitySearchSortBy
): "mostAvailableDays" | "mostGaps" | "nameAsc" | "nameDesc" | "timezoneAsc" {
  switch (sortBy) {
    case AvailabilitySearchSortBy.MostGaps:
      return "mostGaps";
    case AvailabilitySearchSortBy.NameAsc:
      return "nameAsc";
    case AvailabilitySearchSortBy.NameDesc:
      return "nameDesc";
    case AvailabilitySearchSortBy.TimezoneAsc:
      return "timezoneAsc";
    default:
      return "mostAvailableDays";
  }
}

export function SearchScheduleSortMenu({ sortBy, onSortChange }: Readonly<SearchScheduleSortMenuProps>) {
  const t = useAppTranslation().dashboardTranslations.coreSearchSchedule;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const sortActive = isSortApplied(sortBy);
  const currentSortLabel = t.sortOptions[getSortLabelKey(sortBy)];

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (value: AvailabilitySearchSortBy) => {
    onSortChange(value);
    handleClose();
  };

  return (
    <>
      <Tooltip title={`${t.sort}: ${currentSortLabel}`}>
        <IconButton
          aria-label={t.sort}
          aria-pressed={sortActive}
          onClick={handleOpen}
          size="small"
          color={sortActive ? "primary" : "default"}
          sx={theme => ({
            ...(sortActive ? { backgroundColor: alpha(theme.palette.primary.main, 0.12) } : {}),
          })}
        >
          <SortOutlined fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
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
