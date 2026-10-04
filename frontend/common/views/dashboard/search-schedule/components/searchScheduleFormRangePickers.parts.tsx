"use client";

import { Box, type SxProps, type Theme } from "@mui/material";
import { AppDateRangePicker } from "@/frontend/common/components/ui/form/date";
import { AppTimeRangePicker } from "@/frontend/common/components/ui/form/time";
import type { SearchScheduleFormProps } from "@/frontend/common/views/dashboard/search-schedule/types";

type FormRangePickersProps = Readonly<{
  labels: SearchScheduleFormProps["labels"];
  draft: SearchScheduleFormProps["draft"];
  dateRangeBoxSx: SxProps<Theme>;
  timeRangeBoxSx: SxProps<Theme>;
  onDraftChange: SearchScheduleFormProps["onDraftChange"];
}>;

export function FormRangePickers({
  labels,
  draft,
  dateRangeBoxSx,
  timeRangeBoxSx,
  onDraftChange,
}: FormRangePickersProps) {
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
