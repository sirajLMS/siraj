import { Box, Paper, Typography } from "@mui/material";
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

export const SuspensionAnalyticsChart = ({ labels }: { labels: SuspensionAnalyticsLabels }) => {
  return (
    <Paper
      elevation={0}
      sx={theme => ({
        p: 3,
        borderRadius: theme.layout.radius.card,
        border: `1px solid ${theme.palette.border.light}`,
      })}
    >
      <Typography
        variant="titleLg"
        sx={theme => ({
          fontFamily: '"Hanken Grotesk", sans-serif',
          fontSize: "18px",
          fontWeight: 700,
          color: theme.palette.primary.main,
          mb: 2,
        })}
      >
        {labels.suspensionAnalytics}
      </Typography>

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
          <Box
            key={labels.days[i] ?? i}
            sx={theme => ({
              flex: 1,
              height: `${pct}%`,
              bgcolor: isHighlighted ? theme.palette.error.main : theme.palette.primaryContainer,
              borderRadius: "3px 3px 0 0",
              transition: "height 0.3s ease",
              "&:hover": { opacity: 0.85 },
            })}
            title={labels.days[i] ?? String(i)}
          />
        ))}
      </Box>

      {/* Day labels */}
      <Box sx={{ display: "flex", justifyContent: "space-between", px: 1, mt: 1 }}>
        {labels.days.map((day, i) => (
          <Typography
            key={day}
            variant="labelSm"
            sx={theme => ({
              flex: 1,
              textAlign: "center",
              fontSize: "11px",
              fontFamily: '"Inter", sans-serif',
              fontWeight: BAR_HEIGHTS[i]?.isHighlighted ? 700 : 400,
              color: BAR_HEIGHTS[i]?.isHighlighted ? theme.palette.error.main : theme.palette.text.secondary,
            })}
          >
            {day}
          </Typography>
        ))}
      </Box>

      <Typography
        variant="bodyMd"
        sx={theme => ({
          mt: 2,
          fontSize: "13px",
          color: theme.palette.text.secondary,
        })}
      >
        {labels.analyticsNote}
      </Typography>
    </Paper>
  );
};
