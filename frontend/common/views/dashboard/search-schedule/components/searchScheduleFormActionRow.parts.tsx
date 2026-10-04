"use client";

import { FilterListOutlined, SearchOutlined } from "@mui/icons-material";
import { Badge, Box, Button, CircularProgress, IconButton, Tooltip } from "@mui/material";
import type { SearchScheduleFormSlotProps } from "@/frontend/common/views/dashboard/search-schedule/components/searchScheduleFormShared.types";
import type { SearchScheduleFormProps } from "@/frontend/common/views/dashboard/search-schedule/types";

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
  actionRowBoxSx: SearchScheduleFormSlotProps["actionRowBoxSx"];
  innerActionsBoxSx: SearchScheduleFormSlotProps["innerActionsBoxSx"];
  isSearching: boolean;
}>;

export function FormActionRow({
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
