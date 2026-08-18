"use client";

import { Box, Tooltip } from "@mui/material";
import { resolveBrowserIanaTimezoneId } from "@/frontend/common/lib/timezone";
import { StyledMonospaceLabel } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewDataGrid.styles";
import { buildScheduleTimezoneOffsetDetail } from "@/frontend/common/views/dashboard/admin/home/utils/formatScheduleTime";
import { Translation, useAppLocale, useAppTranslation } from "@/shared/locale";

export interface ScheduleTimezoneOffsetCellProps {
  readonly timeValue: string | null | undefined;
  readonly timezone: string | null | undefined;
  readonly at?: string | null;
}

function ScheduleTimezoneOffsetTooltipBody({
  time,
  timezoneName,
  timezoneUtcOffset,
  yourUtcOffset,
  labels,
}: {
  readonly time: string;
  readonly timezoneName: string;
  readonly timezoneUtcOffset: string;
  readonly yourUtcOffset: string;
  readonly labels: {
    readonly time: string;
    readonly timezone: string;
    readonly utcOffset: string;
    readonly yourOffset: string;
  };
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, py: 0.25 }}>
      {time ? (
        <Box component="span" sx={{ typography: "bodyMd" }}>
          {labels.time}: {time}
        </Box>
      ) : null}
      {timezoneName ? (
        <Box component="span" sx={{ typography: "bodyMd" }}>
          {labels.timezone}: {timezoneName}
        </Box>
      ) : null}
      {timezoneUtcOffset ? (
        <Box component="span" sx={{ typography: "bodyMd" }}>
          {labels.utcOffset}: {timezoneUtcOffset}
        </Box>
      ) : null}
      <Box component="span" sx={{ typography: "bodyMd" }}>
        {labels.yourOffset}: {yourUtcOffset}
      </Box>
    </Box>
  );
}

/**
 * Compact schedule cell: shows the local clock time only.
 * Hover (desktop) or tap (mobile) reveals timezone name and UTC offsets.
 */
export function ScheduleTimezoneOffsetCell({ timeValue, timezone, at }: ScheduleTimezoneOffsetCellProps) {
  const locale = useAppLocale();
  const labels = useAppTranslation(Translation.Dashboard.Admin).timezoneOffsetDetail;
  const viewerTimezone = resolveBrowserIanaTimezoneId();
  const detail = buildScheduleTimezoneOffsetDetail({
    timeValue,
    timezone,
    viewerTimezone,
    locale,
    at,
  });

  return (
    <Tooltip
      title={
        <ScheduleTimezoneOffsetTooltipBody
          time={detail.time}
          timezoneName={detail.timezoneName}
          timezoneUtcOffset={detail.timezoneUtcOffset}
          yourUtcOffset={detail.yourUtcOffset}
          labels={labels}
        />
      }
      enterTouchDelay={0}
      leaveTouchDelay={3000}
      describeChild
    >
      <Box
        component="button"
        type="button"
        tabIndex={0}
        aria-label={`${detail.time}. ${labels.timezone}: ${detail.timezoneName}. ${labels.utcOffset}: ${detail.timezoneUtcOffset}. ${labels.yourOffset}: ${detail.yourUtcOffset}`}
        sx={theme => ({
          cursor: "help",
          border: "none",
          background: "transparent",
          padding: 0,
          margin: 0,
          display: "inline-flex",
          alignItems: "center",
          color: "inherit",
          font: "inherit",
          "&:focus-visible": {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
            borderRadius: 1,
          },
        })}
      >
        <StyledMonospaceLabel variant="labelMd">{detail.time}</StyledMonospaceLabel>
      </Box>
    </Tooltip>
  );
}
