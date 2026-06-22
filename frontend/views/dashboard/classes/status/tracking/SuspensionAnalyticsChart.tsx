import { Box, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { SuspensionAnalyticsLabels } from "./SuspensionAnalytics";

const BAR_HEIGHTS: Array<{ pct: number; isHighlighted: boolean }> = [
  { pct: 40, isHighlighted: false },
  { pct: 55, isHighlighted: false },
  { pct: 30, isHighlighted: false },
  { pct: 85, isHighlighted: true },
  { pct: 45, isHighlighted: false },
  { pct: 20, isHighlighted: false },
  { pct: 10, isHighlighted: false },
];

// Bordered paper container that frames the chart section
const StyledChartPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.layout.radius.card,
  border: `1px solid ${theme.palette.border.light}`,
}));

// Hanken Grotesk primary-colored headline used as the chart section title
const StyledChartTitle = styled(Typography)(({ theme }) => ({
  fontFamily: '"Hanken Grotesk", sans-serif',
  fontSize: "18px",
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

// Single bar inside the chart; turns error-red when highlighted, primaryContainer otherwise
const StyledChartBar = styled(Box, {
  shouldForwardProp: prop => prop !== "isHighlighted",
})<{ isHighlighted: boolean }>(({ theme, isHighlighted }) => ({
  flex: 1,
  bgcolor: isHighlighted ? theme.palette.error.main : theme.palette.primaryContainer,
  borderRadius: "3px 3px 0 0",
  transition: "height 0.3s ease",
  "&:hover": { opacity: 0.85 },
}));

// Day-of-week caption beneath each bar; emphasized when the matching bar is highlighted
const StyledDayLabel = styled(Typography, {
  shouldForwardProp: prop => prop !== "isHighlighted",
})<{ isHighlighted: boolean }>(({ theme, isHighlighted }) => ({
  flex: 1,
  textAlign: "center",
  fontSize: "11px",
  fontFamily: '"Inter", sans-serif',
  fontWeight: isHighlighted ? 700 : 400,
  color: isHighlighted ? theme.palette.error.main : theme.palette.text.secondary,
}));

// Secondary-colored caption beneath the chart describing the analytics note
const StyledAnalyticsNote = styled(Typography)(({ theme }) => ({
  fontSize: "13px",
  color: theme.palette.text.secondary,
}));

export const SuspensionAnalyticsChart = ({ labels }: { labels: SuspensionAnalyticsLabels }) => {
  return (
    <StyledChartPaper elevation={0}>
      <StyledChartTitle variant="titleLg" sx={{ mb: 2 }}>
        {labels.suspensionAnalytics}
      </StyledChartTitle>

      {/* Bar chart */}
      <Box
        sx={{
          height: 160,
          display: "flex",
          alignItems: "flex-end",
          gap: 1,
          px: 1,
        }}
      >
        {BAR_HEIGHTS.map(({ pct, isHighlighted }, i) => (
          <StyledChartBar
            key={labels.days[i] ?? i}
            isHighlighted={isHighlighted}
            sx={{ height: `${pct}%` }}
            title={labels.days[i] ?? String(i)}
          />
        ))}
      </Box>

      {/* Day labels */}
      <Box sx={{ display: "flex", justifyContent: "space-between", px: 1, mt: 1 }}>
        {labels.days.map((day, i) => (
          <StyledDayLabel key={day} variant="labelSm" isHighlighted={BAR_HEIGHTS[i]?.isHighlighted ?? false}>
            {day}
          </StyledDayLabel>
        ))}
      </Box>

      <StyledAnalyticsNote variant="bodyMd" sx={{ mt: 2 }}>
        {labels.analyticsNote}
      </StyledAnalyticsNote>
    </StyledChartPaper>
  );
};
