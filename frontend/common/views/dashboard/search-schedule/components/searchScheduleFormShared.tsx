"use client";

import { Box } from "@mui/material";
import type { SyntheticEvent } from "react";
import { FormActionRow } from "@/frontend/common/views/dashboard/search-schedule/components/searchScheduleFormActionRow.parts";
import { FormRangePickers } from "@/frontend/common/views/dashboard/search-schedule/components/searchScheduleFormRangePickers.parts";
import type { SearchScheduleFormSharedProps } from "@/frontend/common/views/dashboard/search-schedule/components/searchScheduleFormShared.types";
import { countActiveDrawerFilters } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterUtils";

export function SearchScheduleFormShared({
  labels,
  draft,
  isSearching,
  onSearch,
  formFilterDrawerOpen,
  onOpenFormFilterDrawer,
  onCloseFormFilterDrawer,
  sortMenuAnchorEl,
  onSortMenuOpen,
  onSortMenuClose,
  onSortChange,
  selectedTeacher,
  onSelectTeacher,
  onDraftChange,
  TeacherAutocomplete,
  SortMenu,
  FilterDrawer,
  formBoxSx,
  dateRangeBoxSx,
  timeRangeBoxSx,
  teacherBoxSx,
  actionRowBoxSx,
  innerActionsBoxSx,
}: Readonly<SearchScheduleFormSharedProps>) {
  const activeFilterCount = countActiveDrawerFilters(draft);

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch();
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Box sx={formBoxSx}>
          <FormRangePickers
            labels={labels}
            draft={draft}
            dateRangeBoxSx={dateRangeBoxSx}
            timeRangeBoxSx={timeRangeBoxSx}
            onDraftChange={onDraftChange}
          />

          <Box sx={teacherBoxSx}>
            <TeacherAutocomplete
              value={selectedTeacher}
              onChange={onSelectTeacher}
              label={labels.teacherName}
              placeholder={labels.teacherNamePlaceholder}
            />
          </Box>

          <FormActionRow
            SortMenu={SortMenu}
            labels={labels}
            draft={draft}
            sortMenuAnchorEl={sortMenuAnchorEl}
            onSortMenuOpen={onSortMenuOpen}
            onSortMenuClose={onSortMenuClose}
            onSortChange={onSortChange}
            onOpenFormFilterDrawer={onOpenFormFilterDrawer}
            activeFilterCount={activeFilterCount}
            actionRowBoxSx={actionRowBoxSx}
            innerActionsBoxSx={innerActionsBoxSx}
            isSearching={isSearching}
          />
        </Box>
      </form>

      <FilterDrawer
        labels={labels}
        open={formFilterDrawerOpen}
        draft={draft}
        onClose={onCloseFormFilterDrawer}
        onDraftChange={onDraftChange}
        onApply={onSearch}
      />
    </>
  );
}
