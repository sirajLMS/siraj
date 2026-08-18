import { AnalyticsOutlined, DownloadOutlined } from "@mui/icons-material";
import { Box, Button, LinearProgress, Paper, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import type { AcademicProgressSummaryProps } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardComponents.types";
import type { StudentProgressItem } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";

export interface AcademicProgressRowOptions {
  readonly wrapperSx: SxProps<Theme>;
  readonly nameContainerSx: SxProps<Theme>;
  readonly linearProgressHeight: number;
}

export interface AcademicProgressRowProps {
  readonly student: StudentProgressItem;
  readonly completionLabel: string;
  readonly options: AcademicProgressRowOptions;
}

export function AcademicProgressRowShared({ student, completionLabel, options }: Readonly<AcademicProgressRowProps>) {
  return (
    <Box sx={options.wrapperSx}>
      <Box sx={options.nameContainerSx}>
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
          height: options.linearProgressHeight,
          borderRadius: "9999px",
          backgroundColor: theme.palette.surfaceContainer,
          "& .MuiLinearProgress-bar": {
            borderRadius: "9999px",
            backgroundColor: theme.palette.header,
          },
        })}
      />
    </Box>
  );
}

export interface AcademicProgressSummarySharedOptions {
  readonly titleVariant: "headlineMd" | "titleLg";
  readonly analyticsIconSize: number;
  readonly paperSx: SxProps<Theme>;
  readonly headerMb: number;
  readonly buttonSx: SxProps<Theme>;
  readonly renderProgressRows: (
    studentProgress: readonly StudentProgressItem[],
    renderRow: (student: StudentProgressItem) => ReactNode
  ) => ReactNode;
  readonly rowOptions: AcademicProgressRowOptions;
}

export function AcademicProgressSummaryShared({
  studentProgress,
  labels,
  onDownloadReport,
  options,
}: Readonly<AcademicProgressSummaryProps> & {
  readonly options: AcademicProgressSummarySharedOptions;
}): ReactNode {
  const rows = options.renderProgressRows(studentProgress, student => (
    <AcademicProgressRowShared
      key={student.id}
      student={student}
      completionLabel={labels.completion(student.completionPercent)}
      options={options.rowOptions}
    />
  ));

  return (
    <Paper elevation={0} sx={options.paperSx}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: options.headerMb }}>
        <Box>
          <Typography variant={options.titleVariant} sx={theme => ({ color: theme.palette.primary.main, mb: 0.5 })}>
            {labels.title}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.subtitle}
          </Typography>
        </Box>
        <AnalyticsOutlined sx={theme => ({ fontSize: options.analyticsIconSize, color: theme.palette.header })} />
      </Box>
      {rows}
      <Button
        variant="outlined"
        fullWidth
        startIcon={<DownloadOutlined />}
        onClick={onDownloadReport}
        sx={options.buttonSx}
      >
        {labels.downloadReport}
      </Button>
    </Paper>
  );
}
