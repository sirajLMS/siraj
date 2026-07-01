"use client";

import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

interface WeekendDayRowProps {
  readonly dayLabel: string;
  readonly weekendOffLabel: string;
}

// Container for a weekend day row with muted background and reduced opacity
const StyledWeekendRowContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  p: 2,
  borderRadius: 3,
  backgroundColor: theme.palette.surfaceContainer,
  opacity: 0.6,
  border: 1,
  borderColor: theme.palette.outlineVariant,
}));

// Day label typography for weekend rows with onSurfaceVariant color
const StyledWeekendDayLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.onSurfaceVariant,
}));

// "Weekend off" badge typography with uppercase italic styling
const StyledWeekendOffBadge = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.labelMd.fontSize,
  fontWeight: 700,
  color: theme.palette.onSurfaceVariant,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  fontStyle: "italic",
  px: 1,
}));

export function WeekendDayRow({ dayLabel, weekendOffLabel }: WeekendDayRowProps) {
  return (
    <StyledWeekendRowContainer>
      <FormControlLabel
        control={<Checkbox checked={false} disabled />}
        label={<StyledWeekendDayLabel>{dayLabel}</StyledWeekendDayLabel>}
      />
      <StyledWeekendOffBadge>{weekendOffLabel}</StyledWeekendOffBadge>
    </StyledWeekendRowContainer>
  );
}
