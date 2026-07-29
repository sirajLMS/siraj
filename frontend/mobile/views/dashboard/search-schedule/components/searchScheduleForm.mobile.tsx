"use client";

import { FilterListOutlined, SearchOutlined } from "@mui/icons-material";
import { Badge, Box, Button, CircularProgress, IconButton, Tooltip } from "@mui/material";
import type { SyntheticEvent } from "react";
import { AppDateRangePicker, AppTimeRangePicker } from "@/frontend/common/components/ui/form";
import { countActiveDrawerFilters } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterUtils";
import type { SearchScheduleFormProps } from "@/frontend/common/views/dashboard/search-schedule/types";
import { TeacherAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import { SearchScheduleSortMenuMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/searchScheduleSortMenu.mobile";
import { SearchScheduleFilterDrawerMobile } from "@/frontend/mobile/views/dashboard/search-schedule/searchScheduleFilterDrawer.mobile";

export function SearchScheduleFormMobile({
  labels,
  draft,
  isSearching,
  onDraftChange,
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
}: Readonly<SearchScheduleFormProps>) {
  const activeFilterCount = countActiveDrawerFilters(draft);

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch();
  };

  const handleDateRangeChange = (fromDate: string, toDate: string) => {
    onDraftChange({ fromDate, toDate });
  };

  const handleTimeRangeChange = (fromTime: string, toTime: string) => {
    onDraftChange({ fromTime, toTime });
  };

  const handleApplyFilters = () => {
    onSearch();
  };

  return (
    <>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          px: 2,
          mb: 1,
        }}
      >
        <Box sx={{ flex: "1 1 100%" }}>
          <AppDateRangePicker
            label={labels.dateRange}
            fromLabel={labels.fromDate}
            toLabel={labels.toDate}
            fromDate={draft.fromDate}
            toDate={draft.toDate}
            onChange={handleDateRangeChange}
          />
        </Box>

        <Box sx={{ flex: "1 1 100%" }}>
          <AppTimeRangePicker
            label={labels.timeRange}
            fromLabel={labels.fromTime}
            toLabel={labels.toTime}
            fromTime={draft.fromTime}
            toTime={draft.toTime}
            onChange={handleTimeRangeChange}
          />
        </Box>

        <Box sx={{ flex: "1 1 100%" }}>
          <TeacherAutocompleteMobile
            value={selectedTeacher}
            onChange={onSelectTeacher}
            label={labels.teacherName}
            placeholder={labels.teacherNamePlaceholder}
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <SearchScheduleSortMenuMobile
              labels={labels}
              sortBy={draft.sortBy}
              sortMenuAnchorEl={sortMenuAnchorEl}
              onSortMenuOpen={onSortMenuOpen}
              onSortMenuClose={onSortMenuClose}
              onSortChange={onSortChange}
            />

            <Tooltip title={labels.filters}>
              <IconButton aria-label={labels.filters} size="small" onClick={onOpenFormFilterDrawer}>
                <Badge badgeContent={activeFilterCount} color="primary" invisible={activeFilterCount === 0}>
                  <FilterListOutlined fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>

          <Button
            type="submit"
            variant="contained"
            size="small"
            disabled={isSearching}
            startIcon={isSearching ? <CircularProgress size={16} color="inherit" /> : <SearchOutlined />}
          >
            {labels.searchBtn}
          </Button>
        </Box>
      </Box>

      <SearchScheduleFilterDrawerMobile
        labels={labels}
        open={formFilterDrawerOpen}
        draft={draft}
        onClose={onCloseFormFilterDrawer}
        onDraftChange={onDraftChange}
        onApply={handleApplyFilters}
      />
    </>
  );
}
