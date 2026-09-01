"use client";

import { FilterListOutlined, SearchOutlined } from "@mui/icons-material";
import { Badge, Box, Button, CircularProgress, IconButton, type SxProps, type Theme, Tooltip } from "@mui/material";
import type { SyntheticEvent } from "react";
import { AppDateRangePicker } from "@/frontend/common/components/ui/form/date";
import { AppTimeRangePicker } from "@/frontend/common/components/ui/form/time";
import { countActiveDrawerFilters } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterUtils";
import type {
  SearchScheduleFormProps,
  SearchScheduleSortMenuProps,
} from "@/frontend/common/views/dashboard/search-schedule/types";

interface SearchScheduleFormSlotProps {
  /** Tier-specific teacher autocomplete — desktop or mobile variant. */
  readonly TeacherAutocomplete: React.FC<{
    readonly value: SearchScheduleFormProps["selectedTeacher"];
    readonly onChange: SearchScheduleFormProps["onSelectTeacher"];
    readonly label: string;
    readonly placeholder: string;
  }>;
  /** Tier-specific sort menu component. */
  readonly SortMenu: React.FC<Readonly<SearchScheduleSortMenuProps>>;
  /** Tier-specific filter drawer component. */
  readonly FilterDrawer: React.FC<{
    readonly labels: SearchScheduleFormProps["labels"];
    readonly open: boolean;
    readonly draft: SearchScheduleFormProps["draft"];
    readonly onClose: () => void;
    readonly onDraftChange: SearchScheduleFormProps["onDraftChange"];
    readonly onApply: () => void;
  }>;
  /** Outer form box sx — desktop uses flex-wrap row, mobile uses column. */
  readonly formBoxSx: SxProps<Theme>;
  /** Date range wrapper Box sx. */
  readonly dateRangeBoxSx: SxProps<Theme>;
  /** Time range wrapper Box sx. */
  readonly timeRangeBoxSx: SxProps<Theme>;
  /** Teacher select wrapper Box sx. */
  readonly teacherBoxSx: SxProps<Theme>;
  /** Action row Box sx (sort + filters + search button container). */
  readonly actionRowBoxSx: SxProps<Theme>;
  /** Inner actions wrapper Box sx (sort + filter icon row). Mobile wraps in a left-aligned box. */
  readonly innerActionsBoxSx?: SxProps<Theme>;
}

type SearchScheduleFormSharedProps = SearchScheduleFormProps & SearchScheduleFormSlotProps;

type FormActionControlsProps = Readonly<{
  SortMenu: SearchScheduleFormSlotProps["SortMenu"];
  labels: SearchScheduleFormProps["labels"];
  draft: SearchScheduleFormProps["draft"];
  sortMenuAnchorEl: SearchScheduleFormProps["sortMenuAnchorEl"];
  onSortMenuOpen: SearchScheduleFormProps["onSortMenuOpen"];
  onSortMenuClose: SearchScheduleFormProps["onSortMenuClose"];
  onSortChange: SearchScheduleFormProps["onSortChange"];
  onOpenFormFilterDrawer: SearchScheduleFormProps["onOpenFormFilterDrawer"];
  activeFilterCount: number;
}>;

function FormActionControls({
  SortMenu,
  labels,
  draft,
  sortMenuAnchorEl,
  onSortMenuOpen,
  onSortMenuClose,
  onSortChange,
  onOpenFormFilterDrawer,
  activeFilterCount,
}: FormActionControlsProps) {
  return (
    <>
      <SortMenu
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
    </>
  );
}

type FormRangePickersProps = Readonly<{
  labels: SearchScheduleFormProps["labels"];
  draft: SearchScheduleFormProps["draft"];
  dateRangeBoxSx: SxProps<Theme>;
  timeRangeBoxSx: SxProps<Theme>;
  onDraftChange: SearchScheduleFormProps["onDraftChange"];
}>;

function FormRangePickers({ labels, draft, dateRangeBoxSx, timeRangeBoxSx, onDraftChange }: FormRangePickersProps) {
  const handleDateRangeChange = (fromDate: string, toDate: string) => {
    onDraftChange({ fromDate, toDate });
  };
  const handleTimeRangeChange = (fromTime: string, toTime: string) => {
    onDraftChange({ fromTime, toTime });
  };
  return (
    <>
      <Box sx={dateRangeBoxSx}>
        <AppDateRangePicker
          label={labels.dateRange}
          fromLabel={labels.fromDate}
          toLabel={labels.toDate}
          fromDate={draft.fromDate}
          toDate={draft.toDate}
          onChange={handleDateRangeChange}
        />
      </Box>
      <Box sx={timeRangeBoxSx}>
        <AppTimeRangePicker
          label={labels.timeRange}
          fromLabel={labels.fromTime}
          toLabel={labels.toTime}
          fromTime={draft.fromTime}
          toTime={draft.toTime}
          onChange={handleTimeRangeChange}
        />
      </Box>
    </>
  );
}

type FormActionRowProps = Readonly<{
  SortMenu: SearchScheduleFormSlotProps["SortMenu"];
  labels: SearchScheduleFormProps["labels"];
  draft: SearchScheduleFormProps["draft"];
  sortMenuAnchorEl: SearchScheduleFormProps["sortMenuAnchorEl"];
  onSortMenuOpen: SearchScheduleFormProps["onSortMenuOpen"];
  onSortMenuClose: SearchScheduleFormProps["onSortMenuClose"];
  onSortChange: SearchScheduleFormProps["onSortChange"];
  onOpenFormFilterDrawer: SearchScheduleFormProps["onOpenFormFilterDrawer"];
  activeFilterCount: number;
  actionRowBoxSx: SxProps<Theme>;
  innerActionsBoxSx?: SxProps<Theme>;
  isSearching: boolean;
}>;

function FormActionRow({
  SortMenu,
  labels,
  draft,
  sortMenuAnchorEl,
  onSortMenuOpen,
  onSortMenuClose,
  onSortChange,
  onOpenFormFilterDrawer,
  activeFilterCount,
  actionRowBoxSx,
  innerActionsBoxSx,
  isSearching,
}: FormActionRowProps) {
  const controls = (
    <FormActionControls
      SortMenu={SortMenu}
      labels={labels}
      draft={draft}
      sortMenuAnchorEl={sortMenuAnchorEl}
      onSortMenuOpen={onSortMenuOpen}
      onSortMenuClose={onSortMenuClose}
      onSortChange={onSortChange}
      onOpenFormFilterDrawer={onOpenFormFilterDrawer}
      activeFilterCount={activeFilterCount}
    />
  );
  return (
    <Box sx={actionRowBoxSx}>
      {innerActionsBoxSx ? <Box sx={innerActionsBoxSx}>{controls}</Box> : controls}
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
  );
}

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
      <Box component="form" onSubmit={handleSubmit} sx={formBoxSx}>
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
