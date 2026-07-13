"use client";

import { AnalyticsOutlined, DownloadOutlined } from "@mui/icons-material";
import { Box, Button, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import type { StudentProgressItem } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";

interface AcademicProgressSummaryProps {
  readonly studentProgress: readonly StudentProgressItem[];
  readonly labels: {
    readonly title: string;
    readonly subtitle: string;
    readonly completion: string;
    readonly downloadReport: string;
  };
  readonly onDownloadReport: () => void;
}

function formatCompletion(template: string, percent: number): string {
  return template.replace("{percent}", String(percent));
}

function ProgressRow({
  student,
  completionLabel,
}: {
  readonly student: StudentProgressItem;
  readonly completionLabel: string;
}) {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
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
          height: 8,
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

export function AcademicProgressSummary({
  studentProgress,
  labels,
  onDownloadReport,
}: Readonly<AcademicProgressSummaryProps>) {
  return (
    <Paper
      elevation={0}
      sx={theme => ({
        p: 3,
        borderRadius: 3,
        backgroundColor: theme.palette.surfaceContainerLowest,
        border: `1px solid ${theme.palette.outlineVariant}`,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      })}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Typography variant="headlineMd" sx={{ color: theme => theme.palette.primary.main, mb: 0.5 }}>
            {labels.title}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.subtitle}
          </Typography>
        </Box>
        <AnalyticsOutlined sx={theme => ({ fontSize: 32, color: theme.palette.header })} />
      </Box>

      <Stack spacing={3} sx={{ mb: 3 }}>
        {studentProgress.map(student => (
          <ProgressRow
            key={student.id}
            student={student}
            completionLabel={formatCompletion(labels.completion, student.completionPercent)}
          />
        ))}
      </Stack>

      <Button
        variant="outlined"
        fullWidth
        startIcon={<DownloadOutlined />}
        onClick={onDownloadReport}
        sx={theme => ({
          py: 1.5,
          borderColor: theme.palette.outlineVariant,
          color: theme.palette.primary.main,
          fontWeight: 700,
          letterSpacing: "0.1em",
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
