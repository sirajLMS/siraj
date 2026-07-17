"use client";

import { FilterListOutlined, SearchOutlined } from "@mui/icons-material";
import { Badge, Box, Button, CircularProgress, IconButton, Tooltip } from "@mui/material";
import { type SyntheticEvent, useState } from "react";
import { AppDateRangePicker, AppTimeRangePicker } from "@/frontend/common/components/ui/form";
import type { SearchScheduleDraftFilters } from "@/frontend/common/stores/searchScheduleStore";
import { countActiveDrawerFilters } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterUtils";
import { SearchScheduleSortMenuMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/searchScheduleSortMenu.mobile";
import { SearchScheduleTeacherAutocompleteMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/searchScheduleTeacherAutocomplete.mobile";
import { SearchScheduleFilterDrawerMobile } from "@/frontend/mobile/views/dashboard/search-schedule/searchScheduleFilterDrawer.mobile";
import { useAppTranslation } from "@/shared/locale";

interface SearchScheduleFormMobileProps {
  readonly draft: SearchScheduleDraftFilters;
  readonly isSearching: boolean;
  readonly onDraftChange: (draft: Partial<SearchScheduleDraftFilters>) => void;
  readonly onSearch: () => void;
}

export function SearchScheduleFormMobile({
  draft,
  isSearching,
  onDraftChange,
  onSearch,
}: Readonly<SearchScheduleFormMobileProps>) {
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
          flexDirection: "column",
          gap: 1,
          px: 2,
          mb: 1,
        }}
      >
        <Box sx={{ flex: "1 1 100%" }}>
          <AppDateRangePicker
            label={t.dateRange}
            fromLabel={t.fromDate}
            toLabel={t.toDate}
            fromDate={draft.fromDate}
            toDate={draft.toDate}
            onChange={handleDateRangeChange}
          />
        </Box>

        <Box sx={{ flex: "1 1 100%" }}>
          <AppTimeRangePicker
            label={t.timeRange}
            fromLabel={t.fromTime}
            toLabel={t.toTime}
            fromTime={draft.fromTime}
            toTime={draft.toTime}
            onChange={handleTimeRangeChange}
          />
        </Box>

        <Box sx={{ flex: "1 1 100%" }}>
          <SearchScheduleTeacherAutocompleteMobile size="small" />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <SearchScheduleSortMenuMobile sortBy={draft.sortBy} onSortChange={sortBy => onDraftChange({ sortBy })} />

            <Tooltip title={t.filters}>
              <IconButton aria-label={t.filters} size="small" onClick={() => setDrawerOpen(true)}>
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
            {t.searchBtn}
          </Button>
        </Box>
      </Box>

      <SearchScheduleFilterDrawerMobile
        open={drawerOpen}
        draft={draft}
        onClose={() => setDrawerOpen(false)}
        onDraftChange={onDraftChange}
        onApply={handleApplyFilters}
      />
    </>
  );
}
