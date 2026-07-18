"use client";

import { AnalyticsOutlined, DownloadOutlined } from "@mui/icons-material";
import { Box, Button, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import type { AcademicProgressSummaryProps } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardComponents.types";
import type { StudentProgressItem } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";

function ProgressRowMobile({
  student,
  completionLabel,
}: {
  readonly student: StudentProgressItem;
  readonly completionLabel: string;
}) {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
        <Typography variant="labelMd" sx={{ fontWeight: 700 }}>
          {student.name}
        </Typography>
        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.header, fontWeight: 700 })}>
          {completionLabel}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={student.completionPercent}
        sx={theme => ({
          height: 6,
          borderRadius: 999,
          backgroundColor: theme.palette.surfaceContainer,
          "& .MuiLinearProgress-bar": {
            borderRadius: 999,
            backgroundColor: theme.palette.header,
          },
        })}
      />
    </Box>
  );
}

export function AcademicProgressSummaryMobile({
  studentProgress,
  labels,
  onDownloadReport,
}: Readonly<AcademicProgressSummaryProps>) {
  return (
    <Paper
      elevation={0}
      sx={theme => ({
        p: 2,
        borderRadius: 2,
        backgroundColor: theme.palette.surfaceContainerLowest,
        border: `1px solid ${theme.palette.outlineVariant}`,
        display: "flex",
        flexDirection: "column",
      })}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
        <Box>
          <Typography variant="titleLg" sx={{ color: theme => theme.palette.primary.main, mb: 0.25 }}>
            {labels.title}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.subtitle}
          </Typography>
        </Box>
        <AnalyticsOutlined sx={theme => ({ fontSize: 24, color: theme.palette.header })} />
      </Box>

      <Stack spacing={2} sx={{ mb: 2 }}>
        {studentProgress.map(student => (
          <ProgressRowMobile
            key={student.id}
            student={student}
            completionLabel={labels.completion(student.completionPercent)}
          />
        ))}
      </Stack>

      <Button
        variant="outlined"
        fullWidth
        startIcon={<DownloadOutlined />}
        onClick={onDownloadReport}
        sx={theme => ({
          py: 1,
          borderColor: theme.palette.outlineVariant,
          color: theme.palette.primary.main,
          fontWeight: 700,
          letterSpacing: "0.08em",
          "&:hover": {
            backgroundColor: theme.palette.header,
            color: theme.palette.onPrimary,
            borderColor: theme.palette.header,
          },
        })}
      >
        {labels.downloadReport}
      </Button>
    </Paper>
  );
}
