"use client";

import { FilterListOutlined, SearchOutlined } from "@mui/icons-material";
import { Badge, Box, Button, CircularProgress, IconButton, Tooltip } from "@mui/material";
import type { SyntheticEvent } from "react";
import { AppDateRangePicker, AppTimeRangePicker } from "@/frontend/common/components/ui/form";
import { countActiveDrawerFilters } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterUtils";
import type { SearchScheduleFormProps } from "@/frontend/common/views/dashboard/search-schedule/types";
import { TeacherAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";
import { SearchScheduleSortMenuDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/components/searchScheduleSortMenu.desktop";
import { SearchScheduleFilterDrawerDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/searchScheduleFilterDrawer.desktop";

export function SearchScheduleFormDesktop({
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
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1,
          mb: 2,
        }}
      >
        <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 200px" }, minWidth: { sm: 200 } }}>
          <AppDateRangePicker
            label={labels.dateRange}
            fromLabel={labels.fromDate}
            toLabel={labels.toDate}
            fromDate={draft.fromDate}
            toDate={draft.toDate}
            onChange={handleDateRangeChange}
          />
        </Box>

        <Box sx={{ flex: { xs: "1 1 100%", sm: "0 1 160px" }, minWidth: { sm: 140 } }}>
          <AppTimeRangePicker
            label={labels.timeRange}
            fromLabel={labels.fromTime}
            toLabel={labels.toTime}
            fromTime={draft.fromTime}
            toTime={draft.toTime}
            onChange={handleTimeRangeChange}
          />
        </Box>

        <Box sx={{ flex: "1 1 200px", minWidth: { xs: "100%", sm: 180 } }}>
          <TeacherAutocompleteDesktop
            value={selectedTeacher}
            onChange={onSelectTeacher}
            label={labels.teacherName}
            placeholder={labels.teacherNamePlaceholder}
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flex: "0 0 auto" }}>
          <SearchScheduleSortMenuDesktop
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

      <SearchScheduleFilterDrawerDesktop
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
