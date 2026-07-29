"use client";

import { Box, LinearProgress, Typography } from "@mui/material";
import {
  clampCompletionPercentage,
  resolveCompletionProgressColor,
} from "@/frontend/common/views/dashboard/student/dashboard/utils/recentLessonReportPresentation";

interface RecentLessonReportCompletionBarProps {
  readonly completionPercentage: number;
}

export function RecentLessonReportCompletionBar({
  completionPercentage,
}: Readonly<RecentLessonReportCompletionBarProps>) {
  const value = clampCompletionPercentage(completionPercentage);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
      <Typography
        variant="labelMd"
        sx={theme => ({
          fontWeight: 700,
          color: resolveCompletionProgressColor(theme, value),
          flexShrink: 0,
          minWidth: 36,
        })}
      >
        {value}%
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <LinearProgress
          variant="determinate"
          value={value}
          sx={theme => ({
            height: 6,
            borderRadius: 999,
            backgroundColor: theme.palette.surfaceContainer,
            "& .MuiLinearProgress-bar": {
              borderRadius: 999,
              backgroundColor: resolveCompletionProgressColor(theme, value),
            },
          })}
        />
      </Box>
    </Box>
  );
}
