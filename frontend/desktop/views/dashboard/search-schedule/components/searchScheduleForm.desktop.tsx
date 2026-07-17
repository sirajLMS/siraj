"use client";

import { FilterListOutlined, SearchOutlined } from "@mui/icons-material";
import { Badge, Box, Button, CircularProgress, IconButton, Tooltip } from "@mui/material";
import { type SyntheticEvent, useState } from "react";
import { AppDateRangePicker, AppTimeRangePicker } from "@/frontend/common/components/ui/form";
import type { SearchScheduleDraftFilters } from "@/frontend/common/stores/searchScheduleStore";
import { countActiveDrawerFilters } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterUtils";
import { SearchScheduleSortMenuDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/components/searchScheduleSortMenu.desktop";
import { SearchScheduleTeacherAutocompleteDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/components/searchScheduleTeacherAutocomplete.desktop";
import { SearchScheduleFilterDrawerDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/searchScheduleFilterDrawer.desktop";
import { useAppTranslation } from "@/shared/locale";

interface SearchScheduleFormDesktopProps {
  readonly draft: SearchScheduleDraftFilters;
  readonly isSearching: boolean;
  readonly onDraftChange: (draft: Partial<SearchScheduleDraftFilters>) => void;
  readonly onSearch: () => void;
}

export function SearchScheduleFormDesktop({
  draft,
  isSearching,
  onDraftChange,
  onSearch,
}: Readonly<SearchScheduleFormDesktopProps>) {
  const t = useAppTranslation().dashboardTranslations.coreSearchSchedule;
  const [drawerOpen, setDrawerOpen] = useState(false);
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
            label={t.dateRange}
            fromLabel={t.fromDate}
            toLabel={t.toDate}
            fromDate={draft.fromDate}
            toDate={draft.toDate}
            onChange={handleDateRangeChange}
          />
        </Box>

        <Box sx={{ flex: { xs: "1 1 100%", sm: "0 1 160px" }, minWidth: { sm: 140 } }}>
          <AppTimeRangePicker
            label={t.timeRange}
            fromLabel={t.fromTime}
            toLabel={t.toTime}
            fromTime={draft.fromTime}
            toTime={draft.toTime}
            onChange={handleTimeRangeChange}
          />
        </Box>

        <Box sx={{ flex: "1 1 200px", minWidth: { xs: "100%", sm: 180 } }}>
          <SearchScheduleTeacherAutocompleteDesktop size="small" />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flex: "0 0 auto" }}>
          <SearchScheduleSortMenuDesktop sortBy={draft.sortBy} onSortChange={sortBy => onDraftChange({ sortBy })} />

          <Tooltip title={t.filters}>
            <IconButton aria-label={t.filters} size="small" onClick={() => setDrawerOpen(true)}>
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
            {t.searchBtn}
          </Button>
        </Box>
      </Box>

      <SearchScheduleFilterDrawerDesktop
        open={drawerOpen}
        draft={draft}
        onClose={() => setDrawerOpen(false)}
        onDraftChange={onDraftChange}
        onApply={handleApplyFilters}
      />
    </>
  );
}
