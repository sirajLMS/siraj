"use client";

import { EventRepeatOutlined, ScheduleOutlined, TuneOutlined } from "@mui/icons-material";
import { Box, Checkbox, FormControlLabel, IconButton, Typography } from "@mui/material";
import { format, isValid, parse } from "date-fns";
import { AppTimePicker } from "@/frontend/components/ui/form";
import type { DayScheduleConfig } from "@/frontend/stores/mockCreateRecurringClassStore";

const TIME_FORMAT = "HH:mm";

function parseTimeValue(timeStr: string): Date | null {
  if (!timeStr) return null;
  const parsed = parse(timeStr, TIME_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

interface MobileDayOverrideRowProps {
  readonly day: DayScheduleConfig;
  readonly dayLabel: string;
  readonly timeOverrideLabel: string;
  readonly index: number;
  readonly onToggleDay: (index: number, enabled: boolean) => void;
  readonly onToggleOverride: (index: number) => void;
  readonly onTimeOverrideChange: (index: number, time: string) => void;
}

export function MobileDayOverrideRow({
  day,
  dayLabel,
  timeOverrideLabel,
  index,
  onToggleDay,
  onToggleOverride,
  onTimeOverrideChange,
}: MobileDayOverrideRowProps) {
  return (
    <Box
      sx={theme => ({
        border: 2,
        borderColor: theme.palette.sidebar,
        borderRadius: theme.layout.radius.card,
        p: 2,
        bgcolor: theme.palette.surface,
        boxShadow: theme.palette.shadow.card,
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={day.enabled}
              onChange={e => {
                onToggleDay(index, e.target.checked);
              }}
              sx={theme => ({
                color: theme.palette.outline,
                "&.Mui-checked": {
                  color: theme.palette.primary.main,
                },
              })}
            />
          }
          label={
            <Typography variant="titleLg" sx={theme => ({ color: theme.palette.sidebar })}>
              {dayLabel}
            </Typography>
          }
        />
        <IconButton
          onClick={() => {
            onToggleOverride(index);
          }}
          sx={theme => ({
            bgcolor: theme.palette.sidebar,
            color: theme.palette.onSidebar,
            "&:hover": { bgcolor: theme.palette.sidebarContainer },
          })}
          aria-label={timeOverrideLabel}
        >
          <TuneOutlined />
        </IconButton>
      </Box>
      <Box
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 1.5,
          border: 1,
          borderColor: theme.palette.outlineVariant,
          borderRadius: theme.layout.radius.button,
          bgcolor: theme.palette.surfaceContainerLowest,
        })}
      >
        <EventRepeatOutlined sx={theme => ({ color: theme.palette.sidebar })} />
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="labelMd"
            sx={theme => ({
              color: theme.palette.onSurfaceVariant,
              textTransform: "uppercase",
            })}
          >
            {timeOverrideLabel}
          </Typography>
          <AppTimePicker
            value={parseTimeValue(day.timeOverride)}
            onChange={(date: Date | null) => {
              onTimeOverrideChange(index, date && isValid(date) ? format(date, TIME_FORMAT) : "");
            }}
            slotProps={{
              textField: {
                variant: "standard",
                sx: { width: "100%" },
                slotProps: {
                  input: {
                    disableUnderline: true,
                    sx: theme => ({ typography: theme.typography.titleLg }),
                  },
                },
              },
            }}
          />
        </Box>
        <ScheduleOutlined sx={theme => ({ color: theme.palette.onSurfaceVariant })} />
      </Box>
    </Box>
  );
}
