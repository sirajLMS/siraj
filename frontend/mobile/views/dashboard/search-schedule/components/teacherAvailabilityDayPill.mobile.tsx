"use client";

import { Box, Chip, Typography } from "@mui/material";
import { format, parse } from "date-fns";

const MAX_VISIBLE_GAPS = 2;

export interface TeacherAvailabilityGapItem {
  readonly id?: string | null;
  readonly calendarDate?: string | null;
  readonly gapStartTime?: string | null;
  readonly gapEndTime?: string | null;
}

interface TeacherAvailabilityDayPillMobileProps {
  readonly calendarDate: string;
  readonly gaps: readonly TeacherAvailabilityGapItem[];
}

function formatGapLabel(gap: TeacherAvailabilityGapItem): string {
  return `${gap.gapStartTime ?? ""} - ${gap.gapEndTime ?? ""}`;
}

export function TeacherAvailabilityDayPillMobile({
  calendarDate,
  gaps,
}: Readonly<TeacherAvailabilityDayPillMobileProps>) {
  const parsedDate = parse(calendarDate, "yyyy-MM-dd", new Date());
  const dayLabel = format(parsedDate, "EEE d MMM").toUpperCase();
  const hasGaps = gaps.length > 0;
  const visibleGaps = gaps.slice(0, MAX_VISIBLE_GAPS);
  const overflowCount = gaps.length - MAX_VISIBLE_GAPS;

  return (
    <Box
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        flexShrink: 0,
        width: "max-content",
        px: 1,
        py: 0.75,
        borderRadius: 1.5,
        border: `1px solid ${theme.palette.outlineVariant}`,
        backgroundColor: hasGaps ? theme.palette.surfaceContainerLow : theme.palette.surfaceContainerLowest,
      })}
    >
      <Typography
        variant="labelMd"
        sx={theme => ({
          color: hasGaps ? theme.palette.onSurface : theme.palette.text.secondary,
          fontWeight: 700,
          whiteSpace: "nowrap",
        })}
      >
        {dayLabel}
      </Typography>

      {hasGaps ? (
        <>
          {visibleGaps.map(gap => (
            <Chip
              key={gap.id ?? `${calendarDate}-${gap.gapStartTime}-${gap.gapEndTime}`}
              label={formatGapLabel(gap)}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 22 }}
            />
          ))}
          {overflowCount > 0 ? <Chip label={`+${overflowCount}`} size="small" sx={{ height: 22 }} /> : null}
        </>
      ) : (
        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          —
        </Typography>
      )}
    </Box>
  );
}
