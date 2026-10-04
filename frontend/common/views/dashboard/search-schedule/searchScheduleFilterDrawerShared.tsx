"use client";

import { Box, Drawer, Typography } from "@mui/material";
import type { SearchScheduleFilterDrawerProps } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterDrawer.types";
import {
  DrawerActions,
  FilterFields,
} from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterDrawerShared.parts";
import { getClearDrawerFiltersPatch } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterUtils";

export interface SearchScheduleFilterDrawerSlotProps {
  readonly daysLabelId: string;
  readonly anchor: "left" | "right" | "top" | "bottom";
  readonly paperSx: Record<string, unknown>;
}

export function SearchScheduleFilterDrawerShared({
  labels,
  open,
  draft,
  onClose,
  onDraftChange,
  onApply,
  daysLabelId,
  anchor,
  paperSx,
}: Readonly<SearchScheduleFilterDrawerProps & SearchScheduleFilterDrawerSlotProps>) {
  const handleClear = () => {
    onDraftChange(getClearDrawerFiltersPatch());
  };

  const handleApply = () => {
    onApply();
    onClose();
  };

  return (
    <Drawer
      anchor={anchor}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: paperSx,
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography variant="titleLg">{labels.filters}</Typography>
        </Box>

        <FilterFields labels={labels} daysLabelId={daysLabelId} draft={draft} onDraftChange={onDraftChange} />

        <DrawerActions labels={labels} onClear={handleClear} onApply={handleApply} />
      </Box>
    </Drawer>
  );
}
